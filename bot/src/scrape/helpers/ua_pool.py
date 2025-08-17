from __future__ import annotations
import random

_DEFAULT_UAS = [
    # Windows (Chrome, Firefox)
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    # macOS (Chrome)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    # Linux (Chrome)
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

class UserAgentPool:
    def __init__(self, user_agents: list[str] | None = None, shuffle: bool = True):
        self.items = list(user_agents or _DEFAULT_UAS)
        if shuffle:
            random.shuffle(self.items)
        self.i = -1

    def next(self) -> str:
        if not self.items:
            return _DEFAULT_UAS[0]
        self.i = (self.i + 1) % len(self.items)
        return self.items[self.i]

    def random(self) -> str:
        return random.choice(self.items or _DEFAULT_UAS)
