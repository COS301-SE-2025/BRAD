from __future__ import annotations
import os, time, random, threading
from typing import List, Optional, Dict
import requests

DEFAULT_PROXY_API = (
    "https://api.proxyscrape.com/v4/free-proxy-list/get"
    "?request=display_proxies&proxy_format=protocolipport&format=text"
)

# ENV knobs
PROXY_ALLOWED_SCHEMES = tuple(
    s.strip().lower() for s in os.getenv("PROXY_ALLOWED_SCHEMES", "https://,socks5://").split(",") if s.strip()
)
PROXY_TEST_URL = os.getenv("PROXY_TEST_URL", "https://www.example.com/")  # HTTPS to force CONNECT
CONNECT_TIMEOUT = float(os.getenv("PROXY_CONNECT_TIMEOUT", "3.5"))
READ_TIMEOUT = float(os.getenv("PROXY_READ_TIMEOUT", "5.0"))

def _req_proxy_dict(proxy_url: str) -> Dict[str, str]:
    return {"http": proxy_url, "https": proxy_url}

def _fetch_raw_list(api_url: Optional[str]) -> List[str]:
    url = api_url or os.getenv("PROXY_API_URL", DEFAULT_PROXY_API)
    r = requests.get(url, timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
    r.raise_for_status()
    lines = [ln.strip() for ln in r.text.splitlines() if ln.strip()]
    # Normalize: allow lines like "http 1.2.3.4:8080" or already "http://1.2.3.4:8080"
    out: List[str] = []
    for ln in lines:
        if "://" in ln:
            out.append(ln)
        elif " " in ln:
            scheme, addr = ln.split(" ", 1)
            out.append(f"{scheme.strip().lower()}://{addr.strip()}")
    return out

def _supports_https_connect(proxy_url: str) -> bool:
    """Return True if proxy can tunnel HTTPS (CONNECT)."""
    try:
        r = requests.get(PROXY_TEST_URL, proxies=_req_proxy_dict(proxy_url),
                         timeout=(CONNECT_TIMEOUT, READ_TIMEOUT))
        return r.ok
    except Exception:
        return False

class ProxyPool:
    """
    Thread-safe proxy pool with HTTPS CONNECT validation.
    - Filters to PROXY_ALLOWED_SCHEMES (default: https, socks5)
    - Validates first N via HTTPS GET (forces CONNECT)
    - Rotates round-robin; ban() removes a proxy
    """
    def __init__(self, api_url: Optional[str] = None, validate_first_n: int = 30):
        self.api_url = api_url or os.getenv("PROXY_API_URL", DEFAULT_PROXY_API)
        self.validate_first_n = validate_first_n
        self._lock = threading.Lock()
        self._proxies: List[str] = []
        self._good: List[str] = []
        self._i = 0
        self._last_fetch = 0.0
        self.refresh_interval = 10 * 60  # seconds

    def _ensure_loaded(self):
        now = time.time()
        if self._good and (now - self._last_fetch) < self.refresh_interval:
            return
        with self._lock:
            if self._good and (now - self._last_fetch) < self.refresh_interval:
                return
            raw = _fetch_raw_list(self.api_url)
            # Filter by allowed schemes
            raw = [p for p in raw if any(p.lower().startswith(s) for s in PROXY_ALLOWED_SCHEMES)]
            head, tail = raw[: self.validate_first_n], raw[self.validate_first_n :]
            validated = [p for p in head if _supports_https_connect(p)]
            # keep some unvalidated as fallback
            validated.extend(tail)
            random.shuffle(validated)
            self._good = validated
            self._proxies = raw
            self._i = 0
            self._last_fetch = now

    def get(self) -> Optional[str]:
        self._ensure_loaded()
        with self._lock:
            if not self._good:
                return None
            p = self._good[self._i % len(self._good)]
            self._i += 1
            return p

    def ban(self, proxy_url: str):
        with self._lock:
            if proxy_url in self._good:
                self._good.remove(proxy_url)

    def count(self) -> int:
        with self._lock:
            return len(self._good)
