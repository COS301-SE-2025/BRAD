# tests/test_sem.py
import importlib
import sys
import types
import pytest


def _reload_sem(fake_redis):
    if "src.utils.sem" in sys.modules:
        sys.modules.pop("src.utils.sem")
    mod = importlib.import_module("src.utils.sem")
    mod.r = fake_redis
    return mod


class FakePipeline:
    def __init__(self, client):
        self.client = client
        self.ops = []

    def zadd(self, key, mapping):
        self.ops.append(("zadd", key, mapping))
        return self

    def zcard(self, key):
        self.ops.append(("zcard", key))
        return self

    def execute(self):
        # Simulate adding a token, then report cardinality.
        added = 1
        self.client.tokens.append(list(self.ops[0][2].keys())[0])
        count = len(self.client.tokens)
        return [added, count]


class FakeRedis:
    def __init__(self):
        self.tokens = []
        self.removes = []
        self.pipelines = []

    def zremrangebyscore(self, key, lo, hi):
        # No-op: we don’t expire tokens in tests so we can simulate "at capacity".
        return 0

    def pipeline(self):
        p = FakePipeline(self)
        self.pipelines.append(p)
        return p

    def zrem(self, key, token):
        self.removes.append((key, token))
        if token in self.tokens:
            self.tokens.remove(token)


def test_acquire_under_limit(monkeypatch):
    fake = FakeRedis()
    mod = _reload_sem(fake)

    tok = mod.acquire("sem:test", limit=2, ttl=30)
    assert isinstance(tok, str)
    assert len(fake.tokens) == 1
    assert fake.pipelines  # pipeline used


def test_acquire_respects_limit(monkeypatch):
    fake = FakeRedis()
    mod = _reload_sem(fake)

    # Pre-fill to hit the limit so the new token puts us over.
    fake.tokens = ["t1", "t2"]

    # Patch time to force the loop to raise on sleep (break the retry loop deterministically).
    monkeypatch.setattr(
        mod, "time",
        types.SimpleNamespace(
            time=lambda: 123456.0,
            sleep=lambda _: (_ for _ in ()).throw(RuntimeError("stop"))
        )
    )

    with pytest.raises(RuntimeError):
        mod.acquire("sem:test", limit=2, ttl=30)

    # We attempted to remove the token after a failed try.
    assert any(isinstance(rem[1], str) for rem in fake.removes)


def test_release_removes_token():
    fake = FakeRedis()
    mod = _reload_sem(fake)

    fake.tokens = ["tok-123"]
    mod.release("sem:test", "tok-123")
    assert ("sem:test", "tok-123") in fake.removes
    assert "tok-123" not in fake.tokens
