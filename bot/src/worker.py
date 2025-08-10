import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import dramatiq
from dramatiq.brokers.redis import RedisBroker

from .forensics.report import ForensicReport
from .utils.analysis import perform_scraping
from .utils.logger import get_logger 

# ─── Logger ───
logger = get_logger(__name__)

# ─── Load Environment ───
load_dotenv()

API_URL = os.getenv("API_URL")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

MAX_RETRIES = 3

# ─── Setup Headers ───
if not AUTH_KEY:
    logger.critical("BOT_ACCESS_KEY missing from .env — bot cannot start.")
    raise RuntimeError("BOT_ACCESS_KEY missing from .env")

headers = {"Authorization": f"Bot {AUTH_KEY}"}

# ─── Redis Broker Setup ───
logger.info(f"Connecting to Redis broker at {REDIS_HOST}:{REDIS_PORT}...")
redis_broker = RedisBroker(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=os.getenv("REDIS_PASSWORD") or None
)
dramatiq.set_broker(redis_broker)
logger.info("Redis broker set successfully.")

# ─── Utility Functions ───
def sanitize_domain(domain: str) -> str:
    return domain.strip().replace("\u200b", "").replace("\u2060", "")

def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if v not in (None, [], {}, "")}
    elif isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, "", [])]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def report_analysis(report_id, report_obj: ForensicReport, scraping_info, abuse_flags):
    url = f"{API_URL}/reports/{report_id}/analysis"
    data = {
        "analysis": serialize(report_obj.to_dict()),
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "done"
    }

    try:
        logger.debug(f"PATCH {url} — sending analysis results...")
        response = requests.patch(url, json=data, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info(f"Report {report_id} updated successfully in API.")
        return True
    except Exception as e:
        logger.error(f"Failed to PATCH analysis for {report_id}: {e}", exc_info=True)
        return False

# ─── Dramatiq Actor: Main Job Consumer ───
@dramatiq.actor(max_retries=MAX_RETRIES, time_limit=60000)
def process_report(data):
    report_id = data.get("report_id")
    domain = data.get("domain")

    if not report_id or not domain:
        logger.warning(f"Skipping invalid job payload: {data}")
        return

    logger.info(f"[BOT] Starting analysis for {domain} (Report ID: {report_id})")

    try:
        domain = sanitize_domain(domain)

        # 1. Gather forensic & risk data
        logger.debug("Running forensic data collection...")
        forensic_data = ForensicReport(domain)
        forensic_data.run()
        logger.debug("Forensic data collection complete.")

        # 2. Perform scraping & abuse flag extraction
        logger.debug("Performing scraping and abuse flag extraction...")
        scraping_info, abuse_flags = perform_scraping(domain, report_id)
        logger.debug("Scraping and abuse flag extraction complete.")

        # 3. Send to API
        if report_analysis(report_id, forensic_data, scraping_info, abuse_flags):
            logger.info(f"[BOT] Report {report_id} successfully analyzed.")
        else:
            logger.warning(f"[BOT] Report {report_id} analysis completed but failed to update API.")

    except Exception as e:
        logger.error(f"[BOT] Analysis failed for {domain}: {e}", exc_info=True)
        raise e
