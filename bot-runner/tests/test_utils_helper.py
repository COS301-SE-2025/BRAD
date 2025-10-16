# tests/test_utils_helper.py
import os
import importlib
import types
import pytest


# ---------- import helpers (stubs + controlled reload) ----------
def _install_stubs(stub_dotenv=True, stub_redis=True):
    """Install stub modules so import-time side effects are deterministic."""
    import sys
    if stub_dotenv:
        # Prevent reading the real .env
        sys.modules["dotenv"] = types.SimpleNamespace(load_dotenv=lambda *a, **k: False)

    if stub_redis:
        # Avoid real Redis connections and middleware side-effects
        class DummyBroker:
            def __init__(self, *a, **k): pass
            def add_middleware(self, *a, **k): pass

        sys.modules["dramatiq.brokers.redis"] = types.SimpleNamespace(RedisBroker=DummyBroker)
        sys.modules["src.utils.job_logging_middleware"] = types.SimpleNamespace(
            JobLoggingMiddleware=lambda *a, **k: object()
        )


def _reload_helper(with_env: dict, stub_redis=True, stub_dotenv=True):
    """
    Reload src.utils.helper with specific environment and stubs so import-time checks
    run deterministically and never touch real services.
    """
    modname = "src.utils.helper"

    # Clean and set env so module sees exactly what we want
    for k in ("BOT_ACCESS_KEY", "API_URL", "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD", "MAX_RETRIES"):
        os.environ.pop(k, None)
    os.environ.update(with_env)

    # Ensure stubs are installed BEFORE importing the module
    _install_stubs(stub_dotenv=stub_dotenv, stub_redis=stub_redis)

    # Evict from cache so top-level code re-executes
    if modname in importlib.sys.modules:
        importlib.sys.modules.pop(modname)

    return importlib.import_module(modname)


# ----------------------- tests -----------------------
def test_import_raises_if_missing_env():
    # Explicitly pass empty strings so the guard `if not ...` triggers
    with pytest.raises(RuntimeError):
        _reload_helper({"BOT_ACCESS_KEY": "", "API_URL": ""}, stub_redis=True, stub_dotenv=True)


def test_import_succeeds_and_api_session_proxy_free():
    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)

    api_sess = getattr(mod, "API_SESSION", None)
    if api_sess is None:
        pytest.skip("API_SESSION not exported by src.utils.helper; skipping proxy check")

    # API session should ignore env proxies and be direct
    assert api_sess.trust_env is False
    assert api_sess.proxies == {}
    assert api_sess.headers.get("Authorization") == "Bot k"
    assert api_sess.headers.get("Content-Type") == "application/json"


def test_sanitize_domain_variants():
    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)
    s = mod.sanitize_domain

    assert s("example.com") == "https://example.com"
    # scheme preserved, host lowercased
    assert s("HTTP://EXAMPLE.com/Path") == "http://example.com/Path"
    # zero-width chars stripped + https added
    assert s("  examp\u200Ble.\u2060com ") == "https://example.com"
    # empty passthrough
    assert s("") == ""


def test_serialize_dict_list_datetime_roundtrip():
    from datetime import datetime, timezone

    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)

    serialize = getattr(mod, "serialize", None)
    if serialize is None:
        pytest.skip("serialize not exported by src.utils.helper")

    now = datetime(2025, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    data = {
        "a": 1,
        "b": "",
        "c": None,
        "d": [],
        "e": {},
        "f": [1, "", None, [], 2],
        "g": {"x": "", "y": 2, "z": None},
        "t": now,
    }
    out = serialize(data)

    # Drops empty/None fields at all levels
    assert "b" not in out and "c" not in out and "d" not in out and "e" not in out
    # Cleans list
    assert out["f"] == [1, 2]
    # Cleans nested dict
    assert out["g"] == {"y": 2}
    # Datetime to ISO string (timezone retained)
    assert out["t"].endswith("03:04:05+00:00")


def test_report_analysis_success_sends_patch(monkeypatch):
    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)

    api_sess = getattr(mod, "API_SESSION", None)
    if api_sess is None:
        pytest.skip("API_SESSION not exported/defined by src.utils.helper; skipping API PATCH test")

    class DummyReport:
        def to_dict(self):
            return {"domain": "example.com", "riskScore": 1.23}

    body_captured = {}

    class FakeResp:
        status_code = 200
        def raise_for_status(self): return None

    def fake_patch(url, json=None, timeout=None):
        body_captured["url"] = url
        body_captured["json"] = json
        body_captured["timeout"] = timeout
        return FakeResp()

    monkeypatch.setattr(api_sess, "patch", fake_patch)

    ok = mod.report_analysis(
        report_id="abc123",
        report_obj=DummyReport(),
        scraping_info={"t": 1, "empty": "", "none": None},
        abuse_flags=[],
    )

    assert ok is True
    assert body_captured["url"] == "http://api:3000/reports/abc123/analysis"
    assert body_captured["json"]["analysis"] == {"domain": "example.com", "riskScore": 1.23}
    assert body_captured["json"]["scrapingInfo"] == {"t": 1}
    assert body_captured["json"]["abuseFlags"] == []
    assert body_captured["json"]["analysisStatus"] == "pending"
    assert body_captured["timeout"] == 20


def test_report_analysis_failure_returns_false(monkeypatch):
    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)

    api_sess = getattr(mod, "API_SESSION", None)
    if api_sess is None:
        pytest.skip("API_SESSION not exported/defined by src.utils.helper; skipping API PATCH test")

    class DummyReport:
        def to_dict(self):
            return {"ok": True}

    def fake_patch(*a, **k):
        raise RuntimeError("boom")

    monkeypatch.setattr(api_sess, "patch", fake_patch)

    ok = mod.report_analysis("id1", DummyReport(), scraping_info={}, abuse_flags={})
    assert ok is False


def test_report_analysis_skips_when_env_missing():
    # First import with env present to get a module object
    mod = _reload_helper({"BOT_ACCESS_KEY": "k", "API_URL": "http://api:3000"}, stub_redis=True)
    # Then blank out inside the module to exercise guard branch
    mod.API_URL = None
    mod.AUTH_KEY = None

    class DummyReport:
        def to_dict(self): return {}

    assert mod.report_analysis("x", DummyReport(), {}, {}) is False
