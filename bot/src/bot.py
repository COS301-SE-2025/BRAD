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

# ─── Environment Variables ─────────────────────────────────────────────
API_URL = os.getenv("API_URL", "http://localhost:3000")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
QUEUE_NAME = "bull:reportQueue:wait"
JOB_PREFIX = "bull:reportQueue:jobs:"
MAX_RETRIES = 3

# ─── Authentication Headers ────────────────────────────────────────────
if not AUTH_KEY:
    raise RuntimeError("BOT_ACCESS_KEY missing from environment.")

headers = {'Authorization': f"Bot {AUTH_KEY}"}


# ─── Redis Setup ───────────────────────────────────────────────────────
def connect_redis():
    while True:
        try:
            r = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD,
                decode_responses=True
            )
            r.ping()
            print("[BOT] Connected to Redis")
            return r
        except redis.exceptions.ConnectionError as e:
            print(f"[BOT] Redis not ready. Retrying... ({e})")
            time.sleep(2)


# ─── Utility Functions ─────────────────────────────────────────────────
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

# ─── Report Submitter ──────────────────────────────────────────────────
def report_analysis(report_id, analysis_data, scraping_info, abuse_flags):
    url = f"{API_URL}/reports/{report_id}/analysis"
    data = {
        "analysis": serialize(analysis_data),
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

# ─── Domain Analysis ───────────────────────────────────────────────────
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

# ─── Job Fetcher ───────────────────────────────
def fetch_bullmq_job(r):
    job_id = r.rpop(QUEUE_NAME)
    if not job_id:
        return None, None
    job_data_raw = r.hget(f"{JOB_PREFIX}{job_id}", "data")
    if not job_data_raw:
        return None, None
    job = json.loads(job_data_raw)
    return job, job_id

def mark_completed(r, job_id):
    r.hset(f"{JOB_PREFIX}{job_id}", "returnvalue", '"done"')
    r.sadd("bull:reportQueue:completed", job_id)

def mark_failed(r, job_id):
    r.sadd("bull:reportQueue:failed", job_id)


# ─── Main Bot Runner ───────────────────────────────────────────────────
def run_bot():
    r = connect_redis()
    print(f"[BOT] Listening on BullMQ queue: {QUEUE_NAME}")

    while True:
        try:
            job, job_id = fetch_bullmq_job(r)
            if not job:
                time.sleep(2)
                continue

            report_id = job.get("reportId")
            domain = job.get("domain")
            if not report_id or not domain:
                print(f"[BOT] Skipping invalid job: {job}")
                continue

            print(f"\n[BOT] Analyzing {domain} (Report ID: {report_id}, Job ID: {job_id})")

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    analysis, scraping, abuse_flags = generate_analysis(domain)
                    if report_analysis(report_id, analysis, scraping, abuse_flags):
                        mark_completed(r, job_id)
                        break
                except Exception as e:
                    print(f"[BOT] Retry {attempt}/{MAX_RETRIES} failed: {e}")
                    time.sleep(2 ** attempt)
            else:
                mark_failed(r, job_id)
                print(f"[BOT] Job {job_id} marked as failed after retries")

        except redis.exceptions.ConnectionError:
            print("[BOT] Lost Redis connection. Reconnecting...")
            r = connect_redis()
        except Exception as e:
            print(f"[BOT] Unexpected error: {e}")
            time.sleep(2)

if __name__ == "__main__":
    print("[BOT] BRAD BullMQ Bot started...\n")
    run_bot()
