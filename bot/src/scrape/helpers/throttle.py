from __future__ import annotations
import random, time

def jittered_sleep(base_seconds: float, jmin: float = 0.7, jmax: float = 1.4):
    """Sleep base_seconds * random[jmin, jmax]."""
    if base_seconds <= 0:
        return
    time.sleep(base_seconds * random.uniform(jmin, jmax))

class Backoff:
    """Exponential backoff with jitter."""
    def __init__(self, base: float = 1.5, max_sleep: float = 20.0, jmin: float = 0.7, jmax: float = 1.4):
        self.attempt = 0
        self.base = base
        self.max_sleep = max_sleep
        self.jmin = jmin
        self.jmax = jmax

    def sleep(self):
        self.attempt += 1
        secs = min(self.base ** self.attempt, self.max_sleep)
        jittered_sleep(secs, self.jmin, self.jmax)

    def reset(self):
        self.attempt = 0
