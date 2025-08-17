import hashlib
from urllib.parse import urlparse

# ---- hashing helper ----
def _sha256(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()

def _hostname(u: str) -> str:
    return (urlparse(u).hostname or "").lower()

def _subdomain_of(host: str, apex: str) -> bool:
    return host.endswith("." + apex)

class NetworkCollector:
    """
    Collect per-page and per-crawl network info (url, method, status, resourceType).
    """
    def __init__(self):
        self.page_reqs: list[dict] = []
        self.all_reqs: list[dict] = []

    def wire(self, page):
        def on_finished(req):
            try:
                resp = req.response()
                status = resp.status if resp else None
                rtype = req.resource_type
                entry = {
                    "url": req.url,
                    "domain": _hostname(req.url),
                    "method": req.method,
                    "status": status,
                    "resourceType": rtype,
                }
                self.page_reqs.append(entry)
                self.all_reqs.append(entry)
            except Exception:
                pass

        page.on("requestfinished", on_finished)
        page.on("requestfailed", lambda req: self.page_reqs.append({
            "url": req.url, "domain": _hostname(req.url),
            "method": req.method, "status": None,
            "resourceType": req.resource_type
        }))

    def flush_page(self) -> list[dict]:
        out = self.page_reqs
        self.page_reqs = []
        return out
