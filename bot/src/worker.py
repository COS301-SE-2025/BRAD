import os
import requests
import time
from datetime import datetime, timezone
from dotenv import load_dotenv
import json, gzip, math, itertools
from typing import Iterable

import dramatiq
from dramatiq.brokers.redis import RedisBroker

from .forensics.report import ForensicReport
from .scrape.scraper import perform_crawl, perform_scraping

from src.utils.logger import get_logger, report_id_ctx
from src.utils.job_logging_middleware import JobLoggingMiddleware
from .utils.sanitize import sanitize_domain
from .utils.serialize import serialize

# NEW: proxy pool (supports ProxyScrape or your own list)
try:
    # If you placed the ProxyPool where we suggested
    from .proxies import ProxyPool
except Exception:
    # Fallback if your local path differs
    try:
        from .proxies import ProxyPool
    except Exception:
        ProxyPool = None  # no dynamic pool available

# ─── Logger ───
logger = get_logger(__name__)

# ─── Load Environment ───
load_dotenv()

# ─── API Config ───
API_URL = os.getenv("API_URL")
AUTH_KEY = os.getenv("BOT_ACCESS_KEY")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
API_MAX_PAYLOAD_KB = int(os.getenv("API_MAX_PAYLOAD_KB", "95"))
API_USE_GZIP = os.getenv("API_USE_GZIP", "false").lower() in ("1","true","yes")

MAX_RETRIES = 3

def _encode_payload(payload: dict, headers: dict):
    if API_USE_GZIP:
        body = gzip.compress(json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))
        hdrs = {**headers, "Content-Type": "application/json", "Content-Encoding": "gzip"}
        return None, body, hdrs
    return payload, None, headers

def _patch_json(url: str, payload: dict, headers: dict, timeout=15):
    json_payload, body_payload, hdrs = _encode_payload(payload, headers)
    if body_payload is not None:
        r = requests.patch(url, data=body_payload, headers=hdrs, timeout=timeout)
    else:
        r = requests.patch(url, json=payload, headers=headers, timeout=timeout)
    r.raise_for_status()
    return True

def _chunk(lst: list, n: int) -> Iterable[list]:
    for i in range(0, len(lst), n):
        yield lst[i:i+n]

# ─── Crawl Config (env-driven) ───
def _env_bool(name: str, default: bool) -> bool:
    return (os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "y", "on"))

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default

def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except Exception:
        return default

def _env_list(name: str) -> list:
    val = os.getenv(name, "")
    return [x.strip() for x in val.split(",") if x.strip()]

CRAWL_ENABLED            = _env_bool("CRAWL_ENABLED", True)
CRAWL_MAX_PAGES          = _env_int("CRAWL_MAX_PAGES", 10)
CRAWL_MAX_DEPTH          = _env_int("CRAWL_MAX_DEPTH", 2)
CRAWL_INCLUDE_SUBDOMAINS = _env_bool("CRAWL_INCLUDE_SUBDOMAINS", False)
CRAWL_USER_AGENT         = os.getenv("CRAWL_USER_AGENT", "BRADBot/1.0")
CRAWL_DELAY_DEFAULT      = _env_float("CRAWL_DELAY_DEFAULT", 1.0)

# Static, comma-separated list (optional), e.g.:
# "http://user:pass@1.2.3.4:8080,socks5://5.6.7.8:1080"
BRAD_PROXIES             = _env_list("BRAD_PROXIES")

# Optional dynamic proxy API (ProxyScrape by default if ProxyPool is used)
PROXY_API_URL            = os.getenv("PROXY_API_URL")  # leave unset to use ProxyPool default

# ─── Setup Headers ───
if not AUTH_KEY:
    logger.critical("BOT_ACCESS_KEY missing from .env — bot cannot start.")
    raise RuntimeError("BOT_ACCESS_KEY missing from .env")

headers = {"Authorization": f"Bot {AUTH_KEY}"}

# ─── Redis Broker Setup ───
logger.info(f"Connecting to Redis broker at {REDIS_HOST}:{REDIS_PORT}...")
redis_broker = RedisBroker(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=os.getenv("REDIS_PASSWORD") or None
)
redis_broker.add_middleware(JobLoggingMiddleware())
dramatiq.set_broker(redis_broker)
logger.info("Redis broker set successfully.")

# ─── Proxy getter wiring ───
def _make_proxy_getter():
    """
    Returns a callable that yields the next proxy string
    (e.g., 'http://ip:port' or 'socks5://ip:port'), or None.
    Prefers static BRAD_PROXIES if provided; otherwise uses ProxyPool (ProxyScrape).
    """
    if BRAD_PROXIES:
        # simple round-robin over the provided list
        proxies = list(BRAD_PROXIES)
        n = len(proxies)
        idx = {"i": -1}
        def _next():
            if n == 0:
                return None
            idx["i"] = (idx["i"] + 1) % n
            return proxies[idx["i"]]
        logger.info(f"Using static proxy list (BRAD_PROXIES), count={n}")
        return _next

    if ProxyPool is not None:
        pool = ProxyPool(api_url=PROXY_API_URL)  # ProxyScrape by default
        logger.info("Using dynamic proxy pool (ProxyScrape).")
        return pool.get

    logger.info("No proxies configured; crawling without proxies.")
    return lambda: None

# ─── Utility Functions ───

def _shrink_scrape_payload(scraping_info: dict, abuse_flags: dict,
                           snippet_limit: int = 8000, max_items: int = 50):
    """
    Reduce payload to fit API limits (~100 KB by default).
    - Drop htmlRaw everywhere
    - Trim htmlSnippet
    - Cap large arrays (e.g., suspiciousJS, inline events, links)
    """
    if not isinstance(scraping_info, dict):
        return scraping_info, abuse_flags

    pages = scraping_info.get("pages") or []
    for i, p in enumerate(pages):
        if "htmlRaw" in p:
            p["htmlRaw"] = ""  # never send full HTML in API payload
        if "htmlSnippet" in p and isinstance(p["htmlSnippet"], str):
            p["htmlSnippet"] = p["htmlSnippet"][:snippet_limit]

        si = p.get("structuredInfo", {})
        for k in ("links", "headings", "forms"):
            if isinstance(si.get(k), list) and len(si[k]) > max_items:
                si[k] = si[k][:max_items]
        p["structuredInfo"] = si

    # Also trim single-page shape (if not using crawl)
    si = scraping_info.get("structuredInfo", {})
    if isinstance(si.get("links"), list) and len(si["links"]) > max_items:
        si["links"] = si["links"][:max_items]
    scraping_info["structuredInfo"] = si
    if "htmlRaw" in scraping_info:
        scraping_info["htmlRaw"] = ""
    if "htmlSnippet" in scraping_info:
        scraping_info["htmlSnippet"] = scraping_info["htmlSnippet"][:snippet_limit]

    # Trim abuse_flags arrays
    def _cap_list(d: dict, key: str):
        if isinstance(d.get(key), list) and len(d[key]) > max_items:
            d[key] = d[key][:max_items]

    # Crawl shape
    for p in abuse_flags.get("pages", []) or []:
        for key in ("suspiciousJS", "suspiciousInlineEvents", "redirectChain"):
            _cap_list(p, key)

    # Single-page shape
    for key in ("suspiciousJS", "suspiciousInlineEvents", "redirectChain"):
        _cap_list(abuse_flags, key)

    return scraping_info, abuse_flags

def report_analysis(report_id, report_obj: ForensicReport, scraping_info, abuse_flags):
    url = f"{API_URL}/reports/{report_id}/analysis"

    # 1) Base: light fields only
    base = {
        "analysis": serialize(report_obj.to_dict()),
        "scrapingInfo": serialize({
            "scan": scraping_info.get("scan"),
            "summary": scraping_info.get("summary"),
            # empty shells the server will merge into
            "pages": [],
            "network": {"requests": []},
        }),
        "abuseFlags": serialize({
            "robots": abuse_flags.get("robots"),
            "pages": [],  # fill later
        }),
        "analysisStatus": "partial"
    }

    try:
        _patch_json(url, base, headers)

        # 2) Pages (chunked)
        pages = scraping_info.get("pages", [])
        af_pages = abuse_flags.get("pages", [])
        PAGE_BATCH = 3  # tune to your 100KB limit; 3–5 is usually safe

        for i, (p_chunk, f_chunk) in enumerate(zip(_chunk(pages, PAGE_BATCH), _chunk(af_pages, PAGE_BATCH))):
            payload = {
                "scrapingInfo": serialize({ "pages": p_chunk }),
                "abuseFlags": serialize({ "pages": f_chunk }),
                "analysisStatus": "partial"
            }
            _patch_json(url, payload, headers)

        # 3) Network (chunked)
        net_reqs = (scraping_info.get("network") or {}).get("requests", [])
        NET_BATCH = 200  # tune; keep small
        for j, n_chunk in enumerate(_chunk(net_reqs, NET_BATCH)):
            payload = {
                "scrapingInfo": serialize({ "network": { "requests": n_chunk } }),
                "analysisStatus": "partial"
            }
            _patch_json(url, payload, headers)

        # 4) Done
        done = { "analysisStatus": "pending" }
        _patch_json(url, done, headers)
        logger.info(f"Report {report_id} updated successfully in API (batched).")
        return True

    except Exception as e:
        logger.error(f"Failed to PATCH analysis (batched) for {report_id}: {e}", exc_info=True)
        return False



# ─── Dramatiq Actor: Main Job Consumer ───
@dramatiq.actor(max_retries=MAX_RETRIES, time_limit=300000)  # 5 min for crawls
def process_report(data):
    report_id = data.get("report_id")
    domain = data.get("domain")

    if not report_id or not domain:
        logger.warning(f"Skipping invalid job payload: {data}")
        return

    # Correlate logs with this report
    token = report_id_ctx.set(str(report_id))

    t0 = time.perf_counter()
    logger.debug(f"Received job payload: {data}")
    logger.info(f"[BOT] Starting analysis for {domain} (Report ID: {report_id})")

    try:
        domain = sanitize_domain(domain)

        # 1) Forensics
        logger.debug("Running forensic data collection...")
        forensic_data = ForensicReport(domain)
        forensic_data.run()
        logger.debug("Forensic data collection complete.")

        # 2) Scraping / Crawling
        if CRAWL_ENABLED:
            proxy_getter = _make_proxy_getter()
            logger.debug(
                f"Starting crawl (max_pages={CRAWL_MAX_PAGES}, depth={CRAWL_MAX_DEPTH}, "
                f"subdomains={CRAWL_INCLUDE_SUBDOMAINS}, delay={CRAWL_DELAY_DEFAULT}s, "
                f"proxies={'static' if BRAD_PROXIES else ('dynamic' if ProxyPool else 'none')})"
            )
            try:
                # NOTE: perform_crawl in the updated crawler expects a proxy_getter callable.
                scraping_info, abuse_flags = perform_crawl(
                    start_url=domain,
                    report_id=str(report_id),
                    max_pages=CRAWL_MAX_PAGES,
                    max_depth=CRAWL_MAX_DEPTH,
                    include_subdomains=CRAWL_INCLUDE_SUBDOMAINS,
                    user_agent=CRAWL_USER_AGENT,
                    crawl_delay_default=CRAWL_DELAY_DEFAULT,
                    proxy_getter=proxy_getter,       # <-- key change vs old 'proxies=' param
                )
                pages = scraping_info.get("pages", [])
                logger.info(f"Crawl complete: {len(pages)} page(s) captured.")
                # Fallback to single-page if crawl returned nothing
                if not pages:
                    logger.warning("Crawl returned 0 pages — falling back to single-page scrape.")
                    scraping_info, abuse_flags = perform_scraping(domain, str(report_id))
            except Exception as e:
                logger.error(f"Crawl failed: {e}. Falling back to single-page scrape.", exc_info=True)
                scraping_info, abuse_flags = perform_scraping(domain, str(report_id))
        else:
            logger.debug("CRAWL_ENABLED is false — performing single-page scrape.")
            scraping_info, abuse_flags = perform_scraping(domain, str(report_id))

        # 3) Send to API
        if report_analysis(report_id, forensic_data, scraping_info, abuse_flags):
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            logger.info(
                f"[BOT] Report {report_id} successfully analyzed "
                f"(risk={forensic_data.risk_level}, score={forensic_data.risk_score}, {elapsed_ms}ms)"
            )
        else:
            logger.warning(f"[BOT] Report {report_id} analysis completed but failed to update API.")

    except Exception as e:
        logger.error(f"[BOT] Analysis failed for {domain}: {e}", exc_info=True)
        raise
    finally:
        # Always reset the contextvar
        try:
            report_id_ctx.reset(token)
        except Exception:
            pass
