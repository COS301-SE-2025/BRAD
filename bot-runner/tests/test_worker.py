# bot-runner/tests/test_worker.py
import importlib, types, os
import pytest

import sys
from pathlib import Path

# repo root (.. from bot-runner)
REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from bot.src.worker import sanitize_domain

def _reload_worker(env=None):
    # Ensure required env so import guards don't raise
    os.environ.setdefault("BOT_ACCESS_KEY", "k")
    os.environ.setdefault("API_URL", "http://api:3000")
    os.environ.setdefault("REDIS_HOST", "test-redis")

    # Clear cached module so its import-time code runs again
    import sys, types, importlib
    sys.modules.pop("bot.src.worker", None)

    # ---- Stub dramatiq BEFORE importing worker ----
    import dramatiq

    # actor decorator should be a no-op that returns the function itself
    def fake_actor(*a, **kw):
        def deco(fn): return fn
        return deco
    dramatiq.actor = fake_actor

    # set_broker should be a no-op
    dramatiq.set_broker = lambda *a, **kw: None

    # Replace RedisBroker with a fake that does nothing on init
    class FakeRedisBroker:
        def __init__(self, *a, **kw): pass
        def add_middleware(self, *a, **kw): pass

    # Inject a fake module for dramatiq.brokers.redis
    sys.modules["dramatiq.brokers.redis"] = types.SimpleNamespace(RedisBroker=FakeRedisBroker)

    # Make sure 'bot' package is importable (requires bot/__init__.py and bot/src/__init__.py)
    import bot  # noqa: F401

    # Now import worker with our stubs in place
    return importlib.import_module("bot.src.worker")


def test_sanitize_and_serialize(monkeypatch):
    mod = _reload_worker()

    assert mod.sanitize_domain("Example.com") == "https://example.com"
    assert mod.sanitize_domain("https://EXAMPLE.com/path") == "https://example.com/path"

    from datetime import datetime, timezone
    now = datetime(2025,1,2,3,4,5, tzinfo=timezone.utc)
    data = {"a": 1, "b": "", "c": None, "d": [], "e": {}, "f": [1, "", None, [], 2], "t": now}
    out = mod.serialize(data)
    assert out == {"a": 1, "f": [1, 2], "t": "2025-01-02T03:04:05+00:00"}

def test_report_analysis_happy_path(monkeypatch):
    mod = _reload_worker()

    # Fake API call
    captured = {}
    class FakeResp:
        def raise_for_status(self): return None
        status_code = 200

    def fake_patch(url, json=None, timeout=None):
        captured["url"] = url
        captured["json"] = json
        captured["timeout"] = timeout
        return FakeResp()

    # Patch the session inside worker
    monkeypatch.setattr(mod, "session", types.SimpleNamespace(patch=fake_patch))

    class DummyReport:
        def to_dict(self): return {"domain": "example.com", "riskScore": 1.0}

    ok = mod.report_analysis("RID-1", DummyReport(), {"pages": []}, {"x": 1})
    assert ok is True
    assert captured["url"] == "http://api:3000/reports/RID-1/analysis"
    assert captured["json"]["analysis"]["domain"] == "example.com"
    assert captured["timeout"] == 30

def test_process_report_spawns_container(monkeypatch):
    mod = _reload_worker()

    class FakeContainer:
        id = "1234567890ab"

    class FakeContainers:
        def run(self, *a, **k): return FakeContainer()

    class FakeClient:
        containers = FakeContainers()

    monkeypatch.setattr(mod.docker, "from_env", lambda: FakeClient())

    calls = {}
    def fake_set(val):
        calls["rid"] = val
        return "tok"
    def fake_reset(tok): calls["reset"] = tok

    monkeypatch.setattr(mod, "report_id_ctx", types.SimpleNamespace(set=fake_set, reset=fake_reset))

    mod.process_report({"report_id":"RID-9", "domain":"https://example.com"})
    assert calls["rid"] == "RID-9"
    assert calls["reset"] == "tok"
