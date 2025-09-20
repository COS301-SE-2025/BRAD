import os, requests, time
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

# Durable HTTP session with retries/backoff for transient API errors.
session = requests.Session()
session.headers.update(headers)
retry = Retry(
    total=5,
    backoff_factor=0.6,  # 0.6, 1.2, 2.4, ...
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
    """Trim zero-width chars, ensure http(s) scheme, and lowercase host."""
    d = (domain or "").strip().replace("\u200b", "").replace("\u2060", "")
    if not d:
        return d
    parsed = urlparse(d)
    if not parsed.scheme:
        d = "https://" + d
        parsed = urlparse(d)
    # Lowercase host; keep path/query as-is
    netloc = (parsed.netloc or "").lower()
    return parsed._replace(netloc=netloc).geturl()


def serialize(obj):
    if isinstance(obj, dict):
        return {
            k: serialize(v)
            for k, v in obj.items()
            if v is not None and v != "" and v != [] and v != {}
        }
    if isinstance(obj, list):
        return [serialize(i) for i in obj if i is not None and i != "" and i != []]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def report_analysis(
    report_id, report_obj: ForensicReport, scraping_info, abuse_flags
) -> bool:
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
        logger.error(
            f"Failed to PATCH analysis for {report_id}: {e} {(' | body='+body) if body else ''}",
            exc_info=True,
        )
        return False


@dramatiq.actor(max_retries=MAX_RETRIES, time_limit=120000)  # 120s hard cap per job
def process_report(job):
    """Expected job: { 'report_id': '...', 'domain': 'https://example.com', optional crawl knobs }"""
    report_id = job.get("report_id")
    domain = job.get("domain")
    if not report_id or not domain:
        logger.warning(f"Skipping invalid job payload: {job}")
        return

    if not isinstance(domain, str):
        logger.warning(f"Invalid domain type for job {report_id}: {type(domain)}")
        return

    token = report_id_ctx.set(report_id)
    t0 = time.perf_counter()
    logger.debug(f"Received job payload: {job}")
    logger.info(f"[BOT] Starting analysis for {domain} (Report ID: {report_id})")

    try:
        domain = sanitize_domain(domain)

        # 1) Forensics
        logger.debug("Running forensic data collection...")
        forensic = ForensicReport(domain)
        forensic.run()  # sets risk_level, risk_score, etc.
        logger.debug("Forensic data collection complete.")

        # 2) Recursive scraping
        logger.debug("Performing scraping and abuse flag extraction...")
        # Clamp knobs to sane bounds to avoid runaway jobs
        max_pages = int(job.get("max_pages", 12) or 12)
        max_pages = max(1, min(100, max_pages))
        max_depth = int(job.get("max_depth", 2) or 2)
        max_depth = max(0, min(5, max_depth))
        delay_seconds = float(job.get("delay_seconds", 1.5) or 1.5)
        delay_seconds = max(0.0, min(5.0, delay_seconds))

        scraping_info, abuse_flags = perform_scraping(
            domain,
            report_id,
            max_pages=max_pages,
            max_depth=max_depth,
            delay_seconds=delay_seconds,
            obey_robots=job.get("obey_robots", True),
            user_agent=job.get("user_agent", None)
            or "BRADBot/1.0 (+https://example.invalid/bot) Playwright",
        )
        logger.debug("Scraping and abuse flag extraction complete.")

        # 3) Send to API
        if report_analysis(report_id, forensic, scraping_info, abuse_flags):
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            site_summary = (scraping_info or {}).get("summary", {})
            site_risk_score = site_summary.get("siteRiskScore")
            site_risk_level = site_summary.get("siteRiskLevel")
            if site_risk_score is not None:
                logger.info(
                    f"[BOT] Report {report_id} analyzed "
                    f"(forensic={forensic.risk_level}/{forensic.risk_score}, "
                    f"site={site_risk_level}/{site_risk_score}, "
                    f"{elapsed_ms}ms)"
                )
            else:
                logger.info(
                    f"[BOT] Report {report_id} analyzed (risk={forensic.risk_level}, score={forensic.risk_score}, {elapsed_ms}ms)"
                )
        else:
            logger.warning(
                f"[BOT] Report {report_id} analysis completed but failed to update API."
            )
    except Exception as e:
        logger.error(f"[BOT] Analysis failed for {domain}: {e}", exc_info=True)
        raise
    finally:
        report_id_ctx.reset(token)
        logger.debug(f"[BOT] Finished processing report {report_id}.")
