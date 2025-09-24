# bot/src/worker.py
import os, requests
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
from docker.types import Mount
from docker.errors import NotFound, APIError
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

# Durable HTTP session with retries/backoff for transient API errors.
session = requests.Session()
session.headers.update(headers)
retry = Retry(
    total=5,
    backoff_factor=0.6,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    raise_on_status=False,
)
adapter = HTTPAdapter(max_retries=retry)
session.mount("https://", adapter)
session.mount("http://", adapter)

# ── Redis Broker ──
logger.info(f"Connecting to Redis broker at {REDIS_HOST}:{REDIS_PORT}...")
redis_broker = RedisBroker(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD)
redis_broker.add_middleware(JobLoggingMiddleware())
dramatiq.set_broker(redis_broker)
logger.info("Redis broker set successfully.")


def sanitize_domain(domain: str) -> str:
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
        return {k: serialize(v) for k, v in obj.items() if v not in (None, "", [], {})}
    if isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, "", [], {})]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def report_analysis(report_id, report_obj: ForensicReport, scraping_info, abuse_flags) -> bool:
    url = f"{API_BASE}/reports/{report_id}/analysis"
    data = {
        "analysis": serialize(report_obj.to_dict()),
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "pending",
    }
    try:
        logger.debug(f"PATCH {url} — sending analysis results...")
        resp = session.patch(url, json=data, timeout=30)
        resp.raise_for_status()
        logger.info(f"Report {report_id} updated successfully in API.")
        return True
    except Exception as e:
        body = ""
        try:
            body = resp.text[:500] if "resp" in locals() and resp is not None else ""
        except Exception:
            pass
        logger.error(f"Failed to PATCH analysis for {report_id}: {e} {(' | body='+body) if body else ''}", exc_info=True)
        return False


@dramatiq.actor(max_retries=3, time_limit=120000)
def process_report(job):
    """Dispatch each report into an isolated, ephemeral runner container."""
    report_id = job.get("report_id")
    domain = job.get("domain")
    if not report_id or not domain:
        logger.warning(f"Skipping invalid job payload: {job}")
        return

    token = report_id_ctx.set(report_id)
    logger.info(f"[DISPATCHER] Spawning sandbox for {domain} (Report ID: {report_id})")

    try:
        client = docker.from_env()

        container = client.containers.run(
            "brad-bot-runner:latest",
            environment={
                "TARGET_URL": domain,
                "REPORT_ID": report_id,
                "API_URL": os.getenv("API_URL"),
                "BOT_ACCESS_KEY": os.getenv("BOT_ACCESS_KEY"),
                "SCREENSHOTS_DIR": "/data/screenshots",
                "UPLOAD_ENDPOINT": f"{os.getenv('API_URL').rstrip('/')}/reports/{report_id}/screenshots",
            },
            network="brad_network",
            tmpfs={"/data/screenshots": ""},   # ephemeral in-memory FS
            volumes={
                os.path.abspath("./logs/bot"): {"bind": "/app/logs", "mode": "rw"},
            },
            detach=True,
            auto_remove=True,                  # runner cleans up itself
        )

        logger.info(f"[DISPATCHER] Sandbox {container.id[:12]} started for {domain}")
    except Exception as e:
        logger.error(
            f"[DISPATCHER] Failed to spawn sandbox for {domain}: {e}", exc_info=True
        )
        raise
    finally:
        report_id_ctx.reset(token)
