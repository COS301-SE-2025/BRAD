import requests

def fetch_pending_report(api_url, headers):
    res = requests.get(f"{api_url}/pending-reports", headers=headers)
    if res.status_code == 204:
        return None
    if res.status_code == 200:
        return res.json()
    raise RuntimeError(f"Unexpected status code: {res.status_code}")

def submit_analysis(api_url, report_id, analysis, headers):
    res = requests.post(f"{api_url}/analyzed-report", json={
        "id": report_id,
        "analysis": analysis
    }, headers=headers)

    print("[API] Response status:", res.status_code)
    print("[API] Response body:", res.text)
    return res.status_code == 200

