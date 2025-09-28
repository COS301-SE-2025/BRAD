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
    # Fake datetime with a controllable utcnow sequence
    class FakeDT:
        calls = 0

        @classmethod
        def utcnow(cls):
            cls.calls += 1
            # Return distinct ISO strings each call; the exact values don't matter
            return types.SimpleNamespace(
                isoformat=lambda: f"2025-01-01T00:00:0{cls.calls}"
            )

    monkeypatch.setattr(NT, "datetime", FakeDT)

    t = NT.NetworkTracker()
    t.mark_start()
    first_summary = t.to_summary()["startTime"]
    t.mark_start()  # should NOT overwrite
    second_summary = t.to_summary()["startTime"]

    assert first_summary == "2025-01-01T00:00:01Z"
    assert second_summary == first_summary  # idempotent
    # utcnow was called once by mark_start, and once by to_summary for end? (no end yet)
    # We don't assert call counts further; just ensure start is stable.


def test_mark_end_and_duration_ms(monkeypatch):
    # Provide fixed start and end to produce a deterministic duration
    class FixedDT:
        _vals = []

        @classmethod
        def utcnow(cls):
            # Pop sequential values: start, end
            return cls._vals.pop(0)

    # Build objects that mimic datetime with isoformat() and subtraction
    class _FakeMoment:
        def __init__(self, iso, seconds=0):
            self._iso = iso
            self._seconds = seconds

        def isoformat(self):
            return self._iso

        def __sub__(self, other):
            # Return an object with total_seconds()
            diff = self._seconds - other._seconds
            return types.SimpleNamespace(total_seconds=lambda: diff)

    start = _FakeMoment("2025-01-01T12:00:00", seconds=0)
    end = _FakeMoment("2025-01-01T12:00:01", seconds=1)  # +1s → 1000 ms

    FixedDT._vals = [start, end]

    monkeypatch.setattr(NT, "datetime", FixedDT)

    t = NT.NetworkTracker()
    t.mark_start()  # consumes start
    t.mark_end()    # consumes end

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
