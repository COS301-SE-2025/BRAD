# tests/test_reporter.py
import os
import json
import importlib
import types
import pytest


def _reload_reporter(env: dict, proxies=None):
    for k in ("API_URL", "BOT_ACCESS_KEY"):
        os.environ.pop(k, None)
    os.environ.update(env)

    if "src.utils.reporter" in importlib.sys.modules:
        importlib.sys.modules.pop("src.utils.reporter")
    mod = importlib.import_module("src.utils.reporter")
    return mod


def test_serialize_filters_values(monkeypatch):
    mod = _reload_reporter({"API_URL": "http://api:3000", "BOT_ACCESS_KEY": "k"})
    data = {
        "a": 1,
        "b": "",
        "c": None,
        "d": [],
        "e": {},
        "f": [1, "", None, [], 2],
        "g": {"x": "", "y": 2, "z": None},
    }
    out = mod.serialize(data)
    assert out == {"a": 1, "f": [1, 2], "g": {"y": 2}}


def test_report_analysis_missing_env_returns_false(monkeypatch):
    mod = _reload_reporter({}, proxies=None)

    class FakeSession:
        def __init__(self): self.patch_called = False
        def patch(self, *a, **k):
            self.patch_called = True
            raise AssertionError("Should not be called when env missing")

    monkeypatch.setattr(mod, "_SESSION", FakeSession())
    ok = mod.report_analysis("r1", {"x": 1}, {}, {})
    assert ok is False


def test_report_analysis_success_sends_patch(monkeypatch):
    mod = _reload_reporter({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, proxies=None)

    captured = {}
    class FakeResp:
        status_code = 200
        text = "ok"
        def raise_for_status(self): return None

    def fake_patch(url, data=None, timeout=None):
        captured["url"] = url
        captured["data"] = data
        captured["timeout"] = timeout
        return FakeResp()

    monkeypatch.setattr(mod._SESSION, "patch", fake_patch)

    analysis = {"domain": "example.com", "riskScore": 1.23, "empty": "", "none": None}
    scraping = {"pages": [], "x": ""}     # serialize drops empties
    flags = {"a": 1, "b": []}

    ok = mod.report_analysis("abc123", analysis, scraping, flags)
    assert ok is True

    assert captured["url"] == "http://api:3000/reports/abc123/analysis"
    assert captured["timeout"] == 20

    body = json.loads(captured["data"])
    assert set(body.keys()) == {"analysis", "scrapingInfo", "abuseFlags", "analysisStatus"}
    assert body["analysis"]["domain"] == "example.com"
    assert "empty" not in body["analysis"]
    assert "none" not in body["analysis"]
    # serialize() removes empty lists/dicts/strings, so pages=[] is dropped
    assert body["scrapingInfo"] == {}
    assert body["abuseFlags"] == {"a": 1}
    assert body["analysisStatus"] == "done"


def test_session_has_auth_header_and_uses_proxies(monkeypatch):
    for k in ("API_URL", "BOT_ACCESS_KEY"):
        os.environ.pop(k, None)
    os.environ.update({"BOT_ACCESS_KEY": "supersecret", "API_URL": "https://api.service"})

    if "src.utils.reporter" in importlib.sys.modules:
        importlib.sys.modules.pop("src.utils.reporter")

    import src.utils.proxy as proxy_mod
    monkeypatch.setattr(proxy_mod, "requests_proxies", lambda: {"https": "http://proxy:8888"})

    mod = importlib.import_module("src.utils.reporter")

    auth = mod._SESSION.headers.get("Authorization")
    assert auth == "Bot supersecret"
    assert mod._SESSION.proxies.get("https") == "http://proxy:8888"


def test_report_analysis_handles_http_error_and_returns_false(monkeypatch):
    mod = _reload_reporter({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, proxies=None)

    class FakeResp:
        status_code = 500
        text = "server error"
        def raise_for_status(self):
            raise RuntimeError("boom")

    def fake_patch(url, data=None, timeout=None):
        return FakeResp()

    monkeypatch.setattr(mod._SESSION, "patch", fake_patch)

    ok = mod.report_analysis("r2", {"domain": "x"}, {}, {})
    assert ok is False
