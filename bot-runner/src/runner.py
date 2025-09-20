import os, time, sys
from datetime import datetime
from urllib.parse import urlparse

from src.forensics.report import ForensicReport
from src.scraper.analysis import perform_scraping
from src.utils.logger import get_logger
from src.utils.helper import (
    report_analysis,
    sanitize_domain,
    serialize,
)  # reuse helpers

logger = get_logger(__name__)


def main():
    report_id = os.getenv("REPORT_ID")
    domain = os.getenv("TARGET_URL")
    api_url = os.getenv("API_URL")
    auth_key = os.getenv("BOT_ACCESS_KEY")

    if not report_id or not domain:
        logger.error("Missing REPORT_ID or TARGET_URL env vars")
        sys.exit(1)

    t0 = time.perf_counter()
    logger.info(f"[RUNNER] Starting analysis for {domain} (Report ID: {report_id})")

    try:
        domain = sanitize_domain(domain)

        # 1) Forensics
        forensic = ForensicReport(domain)
        forensic.run()

        # 2) Recursive scraping
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
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(f"[RUNNER] Report {report_id} completed in {elapsed_ms}ms")
        else:
            logger.warning(
                f"[RUNNER] Report {report_id} completed but API update failed"
            )

    except Exception as e:
        logger.error(f"[RUNNER] Analysis failed: {e}", exc_info=True)
        sys.exit(2)


if __name__ == "__main__":
    main()
