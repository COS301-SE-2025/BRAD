# bot-runner/src/utils/reporter.py
import os
import json
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from .logger import get_logger
from .proxy import requests_proxies  

logger = get_logger(__name__)

API_URL = (os.getenv("API_URL") or "").rstrip("/")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")

if not API_URL:
    logger.critical("API_URL missing — cannot send analysis updates.")
if not AUTH_KEY:
    logger.critical("BOT_ACCESS_KEY missing — cannot authenticate to API.")

# ---- Shared session (proxy + retries + headers) ----
_SESSION = requests.Session()

# Proxies (e.g., {'http': 'http://user:pass@host:3128', 'https': ...})
_PROXIES = requests_proxies()
if _PROXIES:
    _SESSION.proxies.update(_PROXIES)

# Conservative retry/backoff for transient network/proxy hiccups
_retry = Retry(
    total=4,
    connect=3,
    read=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    raise_on_status=False,
)
_SESSION.mount("https://", HTTPAdapter(max_retries=_retry))
_SESSION.mount("http://", HTTPAdapter(max_retries=_retry))

# Default headers
_SESSION.headers.update({
    "Authorization": f"Bot {AUTH_KEY}" if AUTH_KEY else "",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "BRADBot/1.0 (+https://example.invalid/bot)",
})

def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if v not in (None, [], {}, "")}
    if isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, "", [])]
    return obj

def report_analysis(report_id, analysis_data, scraping_info, abuse_flags):
    """
    Send analysis results to the API using the shared proxy-aware session.
    Returns True on success, False otherwise.
    """
    if not API_URL or not AUTH_KEY:
        logger.error("[API] Missing API_URL or BOT_ACCESS_KEY; skipping update.")
        return False

    url = f"{API_URL}/reports/{report_id}/analysis"
    body = {
        "analysis": serialize(analysis_data),
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "done",
    }

    try:
        logger.info(f"[API] Updating analysis for report {report_id}")
        logger.debug(f"[API] PATCH {url} — payload preview: {json.dumps(body)[:500]}...")
        resp = _SESSION.patch(url, data=json.dumps(body), timeout=20)
        # Note: we pass pre-serialized JSON via data= to avoid double-encoding issues with custom headers
        resp.raise_for_status()
        logger.info(f"[API] Report {report_id} analysis updated successfully ({resp.status_code}).")
        return True
    except Exception as e:
        msg = ""
        try:
            msg = f" | body={resp.text[:400]}" if "resp" in locals() and resp is not None else ""
        except Exception:
            pass
        logger.error(f"[API] Failed to update analysis for {report_id}: {e}{msg}", exc_info=True)
        return False
