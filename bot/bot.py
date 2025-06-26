import os
import time
import sys
import requests
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from utils.analysis import perform_scraping
from utils.metadata import gather_forensics
from utils.reporter import fetch_pending_report

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:3000")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
POLL_INTERVAL = 6

headers = {'Authorization': f"Bot {AUTH_KEY}"}
if not AUTH_KEY:
    raise RuntimeError("BOT_ACCESS_KEY missing from environment.")

def generate_analysis(domain):
    forensics_info = gather_forensics(domain)
    scraping_info, abuse_flags = perform_scraping(domain)
    
    analysis = {
        "domain": domain,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        **forensics_info,
        "riskScore": 100 if "bank" in domain else 20
    }

    return analysis, scraping_info, abuse_flags


def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize(i) for i in obj]
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


def run_bot(run_once=False):
    print(f"[BOT] BRAD is polling every {POLL_INTERVAL}s...\n")

    while True:
        try:
            report = fetch_pending_report(API_URL, headers)

            if not report:
                print("No pending reports.")
            else:
                report_id = report.get("_id") or report.get("id")
                domain = report["domain"]
                print(f"\n[BOT] Analyzing: {domain} (ID: {report_id})")
                time.sleep(2)

                analysis, scraping, abuse_flags = generate_analysis(domain)

                success = report_analysis(report_id, analysis, scraping, abuse_flags)

                if success:
                    print(f"[BOT] Submitted analysis for report {report_id}\n")
                else:
                    print(f"[BOT] Failed to submit analysis for report {report_id}")

        except Exception as e:
            print(f"[BOT] Error: {e}")
            time.sleep(POLL_INTERVAL)

        if run_once:
            break

        time.sleep(POLL_INTERVAL)



if __name__ == "__main__":
    print("[BOT] Starting bot...",flush=True)
    run_bot()
