# bot-runner/src/runner.py
import os, time, sys, glob
from datetime import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from src.forensics.report import ForensicReport
from src.scraper.analysis import perform_scraping
from src.utils.logger import get_logger
from src.utils.helper import report_analysis, sanitize_domain  # reuse helpers
from src.utils.sem import acquire, release
from src.utils.proxy import requests_proxies  

logger = get_logger(__name__)

# ---------- Shared session for uploads (proxy + retries) ----------
_UPLOAD_SESSION = requests.Session()
_PROXIES = requests_proxies()  # {'http': 'http://user:pass@ip:3128', 'https': '...'} or None
if _PROXIES:
    _UPLOAD_SESSION.proxies.update(_PROXIES)

_retry = Retry(
    total=3, connect=3, read=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["POST"],
    raise_on_status=False,
)
_UPLOAD_SESSION.mount("https://", HTTPAdapter(max_retries=_retry))
_UPLOAD_SESSION.mount("http://", HTTPAdapter(max_retries=_retry))
_UPLOAD_SESSION.headers.update({
    "User-Agent": "BRADBot/1.0 (+https://example.invalid/bot)",
})

# <<< derive a key per proxy IP so the cap is per outbound IP >>>
def _proxy_ip():
    url = os.getenv("PROXY_URL", "")
    # crude parse: scheme://host:port
    hostpart = url.split("://")[-1]
    return hostpart.split(":")[0] if hostpart else "direct"

def run_with_limit(fn):
    ip = _proxy_ip()
    limit = int(os.getenv("PW_CONTEXTS_PER_IP", "2"))
    key = f"sem:proxy:{ip}"
    tok = acquire(key, limit, ttl=180)   # hold up to 3 minutes
    try:
        logger.info(f"[SEM] acquired {key} (limit={limit})")
        return fn()
    finally:
        release(key, tok)
        logger.info(f"[SEM] released {key}")

# <<< Upload all PNGs in shots_dir to the given upload_url with auth_key.>>>
def upload_screenshots(upload_url: str, auth_key: str, shots_dir: str) -> None:
    if not upload_url: return
    if not os.path.isdir(shots_dir): return

    s = requests.Session()
    s.trust_env = False          # ignore env proxies
    s.proxies.clear()

    headers = {"Authorization": f"Bot {auth_key}"} if auth_key else {}
    for path in sorted(glob.glob(os.path.join(shots_dir, "*.png"))):
        fname = os.path.basename(path)
        try:
            with open(path, "rb") as f:
                r = s.post(upload_url, headers=headers,
                           files={"file": (fname, f, "image/png")}, timeout=120)
            r.raise_for_status()
            logger.info(f"[RUNNER] Uploaded {fname}")
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
        def _do_scrape():
            return perform_scraping(
                domain,
                report_id,
                max_pages=12,
                max_depth=2,
                delay_seconds=1.5,
                obey_robots=True,
                user_agent="BRADBot/1.0 (+https://example.invalid/bot) Playwright",
                # proxy is auto-read from env in analysis.py
            )

        scraping_info, abuse_flags = run_with_limit(_do_scrape)

        # 3) Send results back to API
        #    NOTE: helper.report_analysis expects a dict for analysis_data
        ok = report_analysis(report_id, forensic, scraping_info, abuse_flags)
        if ok:
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
