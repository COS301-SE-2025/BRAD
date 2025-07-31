import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
import dramatiq
from dramatiq.brokers.redis import RedisBroker

from .forensics.report import ForensicReport
from .utils.analysis import perform_scraping  # still used for scrapingInfo and abuseFlags

# ─── Load Environment ───
load_dotenv()

API_URL = os.getenv("API_URL")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

MAX_RETRIES = 3

# ─── Setup Headers ───
if not AUTH_KEY:
    raise RuntimeError("BOT_ACCESS_KEY missing from .env")

headers = {"Authorization": f"Bot {AUTH_KEY}"}

# ─── Redis Broker Setup ───
redis_broker = RedisBroker(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=os.getenv("REDIS_PASSWORD") or None
)
dramatiq.set_broker(redis_broker)

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
        response = requests.patch(url, json=data, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"[BOT] Report {report_id} updated successfully")
        return True
    except Exception as e:
        print(f"[BOT] Failed to PATCH analysis for {report_id}: {e}")
        return False

# ─── Dramatiq Actor: Main Job Consumer ───
@dramatiq.actor(max_retries=MAX_RETRIES, time_limit=60000)
def process_report(data):
    report_id = data.get("report_id")
    domain = data.get("domain")

    if not report_id or not domain:
        print(f"[BOT] Skipping invalid job: {data}")
        return

    print(f"\n[BOT] Analyzing {domain} (Report ID: {report_id})")

    try:
        domain = sanitize_domain(domain)

        # 1. Gather forensic & risk data
        forensic_Data = ForensicReport(domain)
        forensic_Data.run()

        # 2. Perform scraping & abuse flag extraction
        scraping_info, abuse_flags = perform_scraping(domain)

        # 3. Send to API
        if report_analysis(report_id, forensic_Data, scraping_info, abuse_flags):
            print(f"[BOT] Report {report_id} successfully analyzed.")
    except Exception as e:
        print(f"[BOT] Analysis failed for {domain}: {e}")
        raise e
