#bot-runner/src/utils/helper.py
import os
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
from urllib.parse import urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

import dramatiq
from dramatiq.brokers.redis import RedisBroker

from src.forensics.report import ForensicReport
from src.scraper.analysis import perform_scraping
import docker
from src.utils.logger import get_logger, report_id_ctx
from src.utils.job_logging_middleware import JobLoggingMiddleware

logger = get_logger(__name__)
load_dotenv()

API_URL = os.getenv("API_URL")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD") or None
MAX_RETRIES = int(os.getenv("MAX_RETRIES", 3))

if not AUTH_KEY:
    logger.critical("BOT_ACCESS_KEY missing from .env — bot cannot start.")
    raise RuntimeError("BOT_ACCESS_KEY missing")

if not API_URL:
    logger.critical("API_URL missing from .env — bot cannot start.")
    raise RuntimeError("API_URL missing")

API_BASE = API_URL.rstrip("/")
headers = {"Authorization": f"Bot {AUTH_KEY}"}

# ---- Generic session (unused for API writes; keep if you need elsewhere)
session = requests.Session()
session.headers.update(headers)
_retry = Retry(
    total=5,
    backoff_factor=0.6,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    raise_on_status=False,
)
_adapter = HTTPAdapter(max_retries=_retry)
session.mount("https://", _adapter)
session.mount("http://", _adapter)

# ---- API session: never use proxy; always include auth header
API_SESSION = requests.Session()
API_SESSION.trust_env = False           # ignore HTTP(S)_PROXY env vars
API_SESSION.proxies.clear()             # force direct to internal API
API_SESSION.headers.update({
    "Authorization": f"Bot {AUTH_KEY}",
    "Content-Type": "application/json",
})
_api_retry = Retry(
    total=5,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
API_SESSION.mount("http://", HTTPAdapter(max_retries=_api_retry))
API_SESSION.mount("https://", HTTPAdapter(max_retries=_api_retry))

# ── Redis Broker ──
logger.info(f"Connecting to Redis broker at {REDIS_HOST}:{REDIS_PORT}...")
redis_broker = RedisBroker(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD)
redis_broker.add_middleware(JobLoggingMiddleware())
dramatiq.set_broker(redis_broker)
logger.info("Redis broker set successfully.")


def sanitize_domain(domain: str) -> str:
    """Trim zero-width chars, ensure http(s) scheme, and lowercase host."""
    d = (domain or "").strip().replace("\u200b", "").replace("\u2060", "")
    if not d:
        return d
    parsed = urlparse(d)
    if not parsed.scheme:
        d = "https://" + d
        parsed = urlparse(d)
    netloc = (parsed.netloc or "").lower()
    return parsed._replace(netloc=netloc).geturl()


def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()
                if v is not None and v != "" and v != [] and v != {}}
    if isinstance(obj, list):
        return [serialize(i) for i in obj if i is not None and i != "" and i != []]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def report_analysis(report_id, report_obj: ForensicReport, scraping_info, abuse_flags) -> bool:
    """
    Send analysis results to the API using the proxy-free API_SESSION.
    """
    if not API_URL or not AUTH_KEY:
        logger.error("[API] Missing API_URL or BOT_ACCESS_KEY; skipping update.")
        return False

    url = f"{API_URL}/reports/{report_id}/analysis"
    body = {
        "analysis": serialize(report_obj.to_dict()),   # ensure dict, not object
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "pending",
    }

    try:
        resp = API_SESSION.patch(url, json=body, timeout=20)  # json= sets header
        resp.raise_for_status()
        logger.info(f"[API] Report {report_id} analysis updated.")
        return True
    except Exception as e:
        logger.error(f"[API] Update failed for {report_id}: {e}", exc_info=True)
        return False
