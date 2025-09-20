import requests
import os
import json
from .logger import get_logger

logger = get_logger(__name__)

API_URL = os.getenv("API_URL")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
headers = {'Authorization': f"Bot {AUTH_KEY}"}

def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if v not in (None, [], {}, '')}
    elif isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, '', [])]
    return obj

def report_analysis(report_id, analysis_data, scraping_info, abuse_flags):
    logger.info(f"[API] Preparing to update analysis for report {report_id}")

    url = f"{API_URL}/reports/{report_id}/analysis"
    data = {
        "analysis": serialize(analysis_data),
        "scrapingInfo": serialize(scraping_info),
        "abuseFlags": serialize(abuse_flags),
        "analysisStatus": "done"
    }

    try:
        logger.debug(f"[API] PATCH {url} — Payload: {json.dumps(data)[:500]}...")
        response = requests.patch(url, json=data, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info(f"[API] Analysis for report {report_id} updated successfully.")
        return True
    except Exception as e:
        logger.error(f"[API] Failed to update analysis for report {report_id}: {e}", exc_info=True)
        return False
