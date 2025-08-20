# src/scraper/network_tracker.py
from datetime import datetime

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
            self._first = datetime.utcnow()

    def mark_end(self):
        self._last = datetime.utcnow()

    def to_summary(self):
        start = self._first.isoformat() + "Z" if self._first else None
        end = self._last.isoformat() + "Z" if self._last else None
        duration_ms = (int((self._last - self._first).total_seconds() * 1000)
                       if self._first and self._last else None)
        return {
            "startTime": start,
            "endTime": end,
            "durationMs": duration_ms,
            "requests": self.requests_total,
            "responses": self.responses_total,
            "errors": self.error_count,
            "httpOnHttpsAttempts": self.http_on_https_attempts,
            "statusCounts": self.status_counts,
        }
