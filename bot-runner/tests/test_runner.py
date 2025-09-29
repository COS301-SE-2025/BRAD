# tests/test_runner.py
import os
import io
import importlib
from pathlib import Path
import pytest


def _reload_runner(extra_env=None):
    # fresh env for each import
    for k in ("REPORT_ID","TARGET_URL","API_URL","BOT_ACCESS_KEY",
              "SCREENSHOTS_DIR","UPLOAD_ENDPOINT","PROXY_URL","PW_CONTEXTS_PER_IP"):
        os.environ.pop(k, None)
    if extra_env:
        os.environ.update(extra_env)
    if "src.runner" in importlib.sys.modules:
        importlib.sys.modules.pop("src.runner")
    return importlib.import_module("src.runner")


# ---------- unit tests for helpers in this module ----------

def test_proxy_ip_parsing():
    mod = _reload_runner({"PROXY_URL": "http://10.0.0.5:3128"})
    assert mod._proxy_ip() == "10.0.0.5"
    mod = _reload_runner({"PROXY_URL": ""})
    assert mod._proxy_ip() == "direct"


def test_run_with_limit_calls_acquire_release(monkeypatch):
    mod = _reload_runner({"PROXY_URL": "http://1.2.3.4:8080", "PW_CONTEXTS_PER_IP": "3"})
    calls = {"acq": [], "rel": []}

    def fake_acquire(key, limit, ttl):
        calls["acq"].append((key, limit, ttl))
        return "tok-123"

    def fake_release(key, tok):
        calls["rel"].append((key, tok))

    monkeypatch.setattr("src.runner.acquire", fake_acquire)
    monkeypatch.setattr("src.runner.release", fake_release)

    def fn(): return "ok"

    out = mod.run_with_limit(fn)
    assert out == "ok"
    assert calls["acq"] == [("sem:proxy:1.2.3.4", 3, 180)]
    assert calls["rel"] == [("sem:proxy:1.2.3.4", "tok-123")]


# ---------- upload_screenshots (robust post-import patching) ----------

def test_upload_screenshots_posts_pngs_and_ignores_proxies(tmp_path, monkeypatch):
    # Create a fake screenshots directory with two png files
    shots = tmp_path / "shots"
    shots.mkdir()
    (shots / "a.png").write_bytes(b"\x89PNG\r\n")
    (shots / "b.png").write_bytes(b"\x89PNG\r\n")

    # Import runner first so its import-time session setup isn't affected
    mod = _reload_runner()

    class FakeResp:
        def raise_for_status(self): return None

    class FakeSession:
        def __init__(self):
            # start with proxy-ish defaults to verify function clears them
            self.trust_env = True
            self.proxies = {"http": "X", "https": "Y"}
            self.headers = {}
            self.posts = []

        def post(self, url, headers=None, files=None, timeout=None):
            # verify we get an image and capture the call
            import io
            fn, fileobj, ctype = files["file"]
            assert ctype == "image/png"
            assert isinstance(fileobj, io.BufferedReader)
            self.posts.append((url, headers.get("Authorization"), fn, timeout))
            return FakeResp()

    fake = FakeSession()
    # Patch the Session factory used inside upload_screenshots
    monkeypatch.setattr(mod.requests, "Session", lambda: fake)

    upload_url = "http://api:3000/reports/123/screenshots"
    auth_key = "k"

    # Run
    mod.upload_screenshots(upload_url, auth_key, str(shots))

    # Proxies should be disabled for uploads
    assert fake.trust_env is False
    assert fake.proxies == {}

    # Two files uploaded, with correct headers and timeout
    assert len(fake.posts) == 2
    assert all(p[0] == upload_url for p in fake.posts)           # url
    assert all(p[1] == "Bot k" for p in fake.posts)              # Authorization
    assert {p[2] for p in fake.posts} == {"a.png", "b.png"}      # filenames
    assert all(p[3] == 120 for p in fake.posts)                  # timeout


# ---------- main() happy and error paths ----------

def test_main_happy_path(monkeypatch, tmp_path):
    # Environment
    env = {
        "REPORT_ID": "RID-1",
        "TARGET_URL": "https://Example.com",
        "API_URL": "http://api:3000",
        "BOT_ACCESS_KEY": "k",
        "SCREENSHOTS_DIR": str(tmp_path),
        "UPLOAD_ENDPOINT": "http://api:3000/reports/RID-1/screenshots",
        "PW_CONTEXTS_PER_IP": "2",
    }
    mod = _reload_runner(env)

    # >>> Prevent Redis calls from run_with_limit
    monkeypatch.setattr("src.runner.acquire", lambda key, limit, ttl: "tok-1")
    monkeypatch.setattr("src.runner.release", lambda key, tok: None)

    # Stub ForensicReport to avoid real work
    class DummyReport:
        def __init__(self, d): self.domain = d
        def run(self): pass
        def to_dict(self): return {"domain": "example.com", "riskScore": 1.0}
    monkeypatch.setattr("src.runner.ForensicReport", DummyReport)

    # Stub perform_scraping
    monkeypatch.setattr("src.runner.perform_scraping", lambda *a, **k: ({"pages": []}, {"flags": {}}))

    # Stub report_analysis to claim success
    report_calls = {}
    def fake_report(report_id, report_obj, scraping, flags):
        report_calls["args"] = (report_id, report_obj, scraping, flags)
        return True
    monkeypatch.setattr("src.runner.report_analysis", fake_report)

    # Stub upload_screenshots so we don’t actually touch network
    upload_calls = {}
    def fake_upload(url, key, dir_):
        upload_calls["args"] = (url, key, dir_)
    monkeypatch.setattr("src.runner.upload_screenshots", fake_upload)

    # Prevent sys.exit from stopping the test; capture code
    exit_code = {"code": None}
    monkeypatch.setattr("src.runner.sys.exit", lambda code=0: exit_code.update(code=code))

    mod.main()

    # Assertions
    assert exit_code["code"] == 0
    rid, ro, scraping, flags = report_calls["args"]
    assert rid == "RID-1"
    assert scraping == {"pages": []}
    assert upload_calls["args"][0].endswith("/reports/RID-1/screenshots")
    assert upload_calls["args"][1] == "k"
    assert upload_calls["args"][2] == str(tmp_path)



def test_main_missing_env_exits_1(monkeypatch):
    # Only set one of the required vars
    mod = _reload_runner({"REPORT_ID": "RID-2"})  # TARGET_URL missing

    code = {"c": None}
    monkeypatch.setattr("src.runner.sys.exit", lambda c=0: code.update(c=c))
    mod.main()
    assert code["c"] == 1


# ---------- integration test: main() end-to-end ----------

def test_main_integration(monkeypatch, tmp_path):
    # Set up environment variables
    env = {
        "REPORT_ID": "RID-INT",
        "TARGET_URL": "https://integration.test",
        "API_URL": "http://api:3000",
        "BOT_ACCESS_KEY": "int-key",
        "SCREENSHOTS_DIR": str(tmp_path),
        "UPLOAD_ENDPOINT": "http://api:3000/reports/RID-INT/screenshots",
        "PW_CONTEXTS_PER_IP": "1",
    }
    mod = _reload_runner(env)

    # Patch dependencies to avoid real network/redis/filesystem
    monkeypatch.setattr("src.runner.acquire", lambda key, limit, ttl: "tok-int")
    monkeypatch.setattr("src.runner.release", lambda key, tok: None)

    class DummyReport:
        def __init__(self, d): self.domain = d
        def run(self): pass
        def to_dict(self): return {"domain": "integration.test", "riskScore": 0.5}
    monkeypatch.setattr("src.runner.ForensicReport", DummyReport)

    monkeypatch.setattr("src.runner.perform_scraping", lambda *a, **k: ({"pages": ["home"]}, {"flags": {"ok": True}}))

    report_results = {}
    def fake_report(report_id, report_obj, scraping, flags):
        report_results["args"] = (report_id, report_obj, scraping, flags)
        return True
    monkeypatch.setattr("src.runner.report_analysis", fake_report)

    upload_results = {}
    def fake_upload(url, key, dir_):
        upload_results["args"] = (url, key, dir_)
    monkeypatch.setattr("src.runner.upload_screenshots", fake_upload)

    exit_code = {"code": None}
    monkeypatch.setattr("src.runner.sys.exit", lambda code=0: exit_code.update(code=code))

    # Run main
    mod.main()

    # Assertions
    assert exit_code["code"] == 0
    assert report_results["args"][0] == "RID-INT"
    assert report_results["args"][2] == {"pages": ["home"]}
    assert report_results["args"][3] == {"flags": {"ok": True}}
    assert upload_results["args"][0].endswith("/reports/RID-INT/screenshots")
    assert upload_results["args"][1] == "int-key"
    assert upload_results["args"][2] == str(tmp_path)

