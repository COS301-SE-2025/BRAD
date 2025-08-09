import requests
import os
import json

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
