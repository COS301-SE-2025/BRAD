import os
import time
import json
import redis
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

from utils.analysis import perform_scraping, calculate_risk_score
from utils.metadata import gather_forensics

load_dotenv()

# Environment
API_URL = os.getenv("API_URL", "http://localhost:3000")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_QUEUE = os.getenv("REDIS_QUEUE", "brad:report:queue")

if not AUTH_KEY:
    raise RuntimeError("BOT_ACCESS_KEY missing from environment.")

headers = {'Authorization': f"Bot {AUTH_KEY}"}
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)

def sanitize_domain(domain: str) -> str:
    return domain.strip().replace('\u200b', '').replace('\u2060', '')

def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if v not in (None, [], {}, '')}
    elif isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, '', [])]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def report_analysis(report_id, analysis_data, scraping_info, abuse_flags):
    url = f"{API_URL}/reports/{report_id}/analysis"
    data = {
        "analysis": serialize(analysis_data),
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "done"
    }
    try:
        response = requests.patch(url, json=data, headers=headers)
        response.raise_for_status()
        print(f"[BOT] Analysis for {report_id} updated.")
        return True
    except Exception as e:
        print(f"[BOT] Failed to update analysis: {e}")
        return False

def generate_analysis(domain):
    domain = sanitize_domain(domain)
    forensics_info = gather_forensics(domain)
    scraping_info, abuse_flags = perform_scraping(domain)
    risk_score = calculate_risk_score(scraping_info, abuse_flags)

    analysis = {
        "domain": domain,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        **forensics_info,
        "riskScore": risk_score
    }

    return analysis, scraping_info, abuse_flags

def run_bot():
    print(f"[BOT] Listening on Redis queue: {REDIS_QUEUE}")

    while True:
        try:
            _, raw_data = redis_client.brpop(REDIS_QUEUE, timeout=0)
            job = json.loads(raw_data)

            report_id = job.get("reportId")
            domain = job.get("domain")

            if not report_id or not domain:
                print(f"[BOT] Skipping invalid job: {job}")
                continue

            print(f"\n[BOT] Analyzing domain: {domain} (Report ID: {report_id})")

            analysis, scraping, abuse_flags = generate_analysis(domain)
            success = report_analysis(report_id, analysis, scraping, abuse_flags)

            if success:
                print(f"[BOT] Submitted analysis for report {report_id}")
            else:
                print(f"[BOT] Failed to submit analysis for report {report_id}")

        except Exception as e:
            print(f"[BOT] Error: {e}")
            time.sleep(3)

if __name__ == "__main__":
    print("[BOT] BRAD Bot started...\n")
    run_bot()
