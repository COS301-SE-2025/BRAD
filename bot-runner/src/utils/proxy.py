# bot-runner/src/utils/proxy.py
import os
from urllib.parse import urlparse

URL  = os.getenv("PROXY_URL", "").strip()
USER = os.getenv("PROXY_USERNAME", "").strip()
PASS = os.getenv("PROXY_PASSWORD", "").strip()

def requests_proxies():
    """
    Return a requests-style proxies dict or None.
    Example: {"http": "http://user:pass@ip:3128", "https": "http://user:pass@ip:3128"}
    """
    if not URL:
        return None
    if USER and PASS:
        u = urlparse(URL)
        auth = f"{USER}:{PASS}@"
        server = f"{u.scheme}://{auth}{u.hostname}:{u.port or 3128}"
        return {"http": server, "https": server}
    return {"http": URL, "https": URL}

def playwright_proxy():
    """
    Return a Playwright proxy config or None.
    Example: {"server": "http://ip:3128", "username": "...", "password": "..."}
    """
    if not URL:
        return None
    d = {"server": URL}
    if USER and PASS:
        d["username"] = USER
        d["password"] = PASS
    return d
