# bot-runner/src/runner.py
import os, time, sys, glob
from datetime import datetime

from src.forensics.report import ForensicReport
from src.scraper.analysis import perform_scraping
from src.utils.logger import get_logger
from src.utils.helper import report_analysis, sanitize_domain  # reuse helpers
import requests

logger = get_logger(__name__)

def upload_screenshots(upload_url: str, auth_key: str, shots_dir: str) -> None:
    if not upload_url:
        logger.warning("[RUNNER] UPLOAD_ENDPOINT not set; skipping screenshot upload.")
        return
    if not os.path.isdir(shots_dir):
        logger.info(f"[RUNNER] No screenshots dir found at {shots_dir}")
        return

    headers = {"Authorization": f"Bot {auth_key}"} if auth_key else {}
    files = sorted(glob.glob(os.path.join(shots_dir, "*.png")))
    for path in files:
        fname = os.path.basename(path)
        try:
            with open(path, "rb") as f:
                resp = requests.post(upload_url, headers=headers, files={"file": (fname, f, "image/png")}, timeout=120)
                resp.raise_for_status()
                logger.info(f"[RUNNER] Uploaded {fname} -> {resp.status_code}")
        except Exception as e:
            logger.warning(f"[RUNNER] Upload failed for {fname}: {e}")

def main():
    report_id = os.getenv("REPORT_ID")
    domain = os.getenv("TARGET_URL")
    api_url = os.getenv("API_URL")
    auth_key = os.getenv("BOT_ACCESS_KEY")
    shots_dir = os.getenv("SCREENSHOTS_DIR", "/data/screenshots")
    upload_endpoint = os.getenv("UPLOAD_ENDPOINT")  # e.g. http://api:3000/reports/<id>/screenshots

    if not report_id or not domain:
        logger.error("Missing REPORT_ID or TARGET_URL env vars")
        sys.exit(1)

    t0 = time.perf_counter()
    logger.info(f"[RUNNER] Starting analysis for {domain} (Report ID: {report_id})")
    logger.info(f"[RUNNER] SCREENSHOTS_DIR={shots_dir}")

    try:
        domain = sanitize_domain(domain)

        # 1) Forensics
        forensic = ForensicReport(domain)
        forensic.run()

        # 2) Recursive scraping (writes PNGs into shots_dir)
        scraping_info, abuse_flags = perform_scraping(
            domain,
            report_id,
            max_pages=12,
            max_depth=2,
            delay_seconds=1.5,
            obey_robots=True,
            user_agent="BRADBot/1.0 (+https://example.invalid/bot) Playwright",
        )

        # 3) Send results back to API
        if report_analysis(report_id, forensic, scraping_info, abuse_flags):
            logger.info(f"[RUNNER] Analysis results sent for {report_id}")
        else:
            logger.warning(f"[RUNNER] API update failed for {report_id}")

        # 4) Upload screenshots to API storage, then exit
        upload_screenshots(upload_endpoint, auth_key, shots_dir)

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(f"[RUNNER] Report {report_id} completed in {elapsed_ms}ms")
        sys.exit(0)

    except Exception as e:
        logger.error(f"[RUNNER] Analysis failed: {e}", exc_info=True)
        sys.exit(2)

if __name__ == "__main__":
    main()
