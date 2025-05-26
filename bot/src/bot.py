import os
import time
import random
import requests
from dotenv import load_dotenv
from datetime import datetime, timezone


load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:3000")
POLL_INTERVAL = 10  # seconds

def perform_scraping(domain):
    return {
        "title": f"Mock title for {domain}",
        "malwareDetected": random.random() > 0.85,
        "summary": "Mocked page scan complete. No malicious scripts detected."
    }

def gather_forensics(domain):
    return {
        "ip": f"192.168.0.{random.randint(1, 254)}",
        "registrar": "MockRegistrar Inc.",
        "sslValid": random.random() > 0.3,
        "whoisOwner": "John Doe, MockOrg Ltd."
    }

def generate_analysis(domain):
    return {
        "domain": domain,
        "scannedAt": datetime.now(timezone.utc).isoformat(),
        "riskScore": random.randint(0, 100),
        **perform_scraping(domain),
        **gather_forensics(domain)
    }

def run_bot(run_once=False):
    print(f"Python BRAD Bot polling every {POLL_INTERVAL}s...\n")
    while True:
        try:
            response = requests.get(f"{API_URL}/pending-reports")
            if response.status_code == 204:
                print("No pending reports. Waiting...")
            elif response.status_code == 200:
                report = response.json()
                print(f"Analyzing domain: {report['domain']} (ID: {report['id']})")

                analysis = generate_analysis(report["domain"])
                result = requests.post(f"{API_URL}/analyzed-report", json={
                    "id": report["id"],
                    "analysis": analysis
                })

                if result.status_code == 200:
                    print(f"Report ID {report['id']} analyzed.")
                else:
                    print(f"Failed to submit analysis: {result.status_code}")
            else:
                print(f"Unexpected response: {response.status_code}")
        except Exception as e:
            print(f"Error: {e}")

        if run_once:
            break

        time.sleep(POLL_INTERVAL)

