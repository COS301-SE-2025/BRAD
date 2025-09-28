# src/scraper/network_tracker.py
from datetime import datetime, UTC

def now_utc():
    """Timezone-aware UTC 'now' (seam for tests)."""
    return datetime.now(UTC)

class NetworkTracker:
    def __init__(self):
        self.requests_total = 0
        self.responses_total = 0
        self.error_count = 0
        self.http_on_https_attempts = 0
        self.status_counts = {}
        self._first = None
        self._last = None

    def mark_start(self):
        if self._first is None:
            self._first = now_utc()

    def mark_end(self):
        self._last = now_utc()

    def to_summary(self):
        def _fmt(dt):
            if dt is None:
                return None
            # emit with 'Z' suffix for UTC
            return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")

        duration_ms = (
            int((self._last - self._first).total_seconds() * 1000)
            if self._first and self._last else None
        )
        return {
            "startTime": _fmt(self._first),
            "endTime": _fmt(self._last),
            "durationMs": duration_ms,
            "requests": self.requests_total,
            "responses": self.responses_total,
            "errors": self.error_count,
            "httpOnHttpsAttempts": self.http_on_https_attempts,
            "statusCounts": self.status_counts,
        }
