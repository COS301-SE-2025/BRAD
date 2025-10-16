# tests/test_network_tracker.py
import types
import pytest

import src.scraper.network_tracker as NT


def test_initial_summary_is_empty():
    t = NT.NetworkTracker()
    summ = t.to_summary()
    assert summ["startTime"] is None
    assert summ["endTime"] is None
    assert summ["durationMs"] is None
    assert summ["requests"] == 0
    assert summ["responses"] == 0
    assert summ["errors"] == 0
    assert summ["httpOnHttpsAttempts"] == 0
    assert isinstance(summ["statusCounts"], dict) and summ["statusCounts"] == {}


def test_mark_start_only_sets_first_once(monkeypatch):
    calls = {"n": 0}

    def fake_now():
        calls["n"] += 1
        # minimal object with isoformat + subtract support
        return types.SimpleNamespace(
            isoformat=lambda *a, **k: f"2025-01-01T00:00:0{calls['n']}+00:00",
            __sub__=lambda other: types.SimpleNamespace(total_seconds=lambda: 0),
        )

    monkeypatch.setattr(NT, "now_utc", fake_now)

    t = NT.NetworkTracker()
    t.mark_start()
    first_summary = t.to_summary()["startTime"]
    t.mark_start()  # should NOT overwrite
    second_summary = t.to_summary()["startTime"]

    assert first_summary == "2025-01-01T00:00:01+00:00".replace("+00:00", "Z")
    assert second_summary == first_summary



def test_mark_end_and_duration_ms(monkeypatch):
    class _Moment:
        def __init__(self, iso, seconds):
            self._iso = iso
            self._s = seconds
        def isoformat(self, *a, **k): return self._iso
        def __sub__(self, other):
            return types.SimpleNamespace(total_seconds=lambda: self._s - other._s)

    seq = [
        _Moment("2025-01-01T12:00:00+00:00", 0),
        _Moment("2025-01-01T12:00:01+00:00", 1),
    ]

    monkeypatch.setattr(NT, "now_utc", lambda: seq.pop(0))

    t = NT.NetworkTracker()
    t.mark_start()
    t.mark_end()

    summ = t.to_summary()
    assert summ["startTime"] == "2025-01-01T12:00:00Z"
    assert summ["endTime"] == "2025-01-01T12:00:01Z"
    assert summ["durationMs"] == 1000



def test_counters_reflected_in_summary():
    t = NT.NetworkTracker()
    # simulate some network activity
    t.requests_total = 5
    t.responses_total = 4
    t.error_count = 2
    t.http_on_https_attempts = 3
    t.status_counts = {200: 3, 404: 1}

    summ = t.to_summary()
    assert summ["requests"] == 5
    assert summ["responses"] == 4
    assert summ["errors"] == 2
    assert summ["httpOnHttpsAttempts"] == 3
    assert summ["statusCounts"] == {200: 3, 404: 1}
