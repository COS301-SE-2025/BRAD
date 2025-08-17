from __future__ import annotations
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
import urllib.robotparser as robotparser
import requests, os, re, time, hashlib
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional, Set

from .helpers.ua_pool import UserAgentPool
from .helpers.throttle import jittered_sleep, Backoff
from .helpers.fingerprint import generate_fingerprint, build_context_and_page
from ..utils.logger import get_logger
from .html_parser import extract_links  
from .helpers.network import NetworkCollector, _sha256, _hostname, _subdomain_of



logger = get_logger(__name__)

# ---------- risk as before ----------
def calculate_risk_score(scraping_info: dict, abuse_flags: dict) -> int:
    score = 0
    if abuse_flags.get("malwareDetected"): score += 50
    if abuse_flags.get("redirectChain"): score += 20
    if abuse_flags.get("obfuscatedScripts"): score += 20
    score += len(abuse_flags.get("suspiciousJS", [])) * 5
    score += abuse_flags.get("keywordMatches", 0) * 3
    if abuse_flags.get("similarityScore", 0) > 0.8: score += 15
    return min(max(score, 10), 100)

# ---------- helpers ----------
def normalize_url(u: str) -> str:
    if not u.startswith(("http://", "https://")):
        return "https://" + u
    return u

def _sanitize_for_filename(s: str) -> str:
    s = urldefrag(s)[0]
    parsed = urlparse(s); path = parsed.path if parsed.path else "/"
    base = f"{parsed.netloc}{path}"
    base = re.sub(r'[^A-Za-z0-9._-]+', '_', base)
    h = hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]
    base = base.strip("_")[:80]
    return f"{base}_{h}.png"

def _same_site_ok(base: str, target: str, include_subdomains: bool) -> bool:
    try:
        import tldextract
        bhost = urlparse(base).hostname or ""; thost = urlparse(target).hostname or ""
        be = tldextract.extract(bhost); te = tldextract.extract(thost)
        if (be.domain, be.suffix) != (te.domain, te.suffix): return False
        if not include_subdomains: return bhost.lower() == thost.lower()
        return True
    except Exception:
        b = urlparse(base).netloc.lower(); t = urlparse(target).netloc.lower()
        return t == b if not include_subdomains else (t == b or t.endswith("." + b))

def _is_http_url(u: str) -> bool:
    return urlparse(u).scheme in ("http", "https")

def _load_robots(start_url: str, user_agent: str, requests_proxies: Optional[dict]) -> Tuple[Optional[robotparser.RobotFileParser], Optional[float], str]:
    parsed = urlparse(start_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser(); crawl_delay = None
    try:
        logger.info(f"Fetching robots.txt: {robots_url}")
        r = requests.get(robots_url, timeout=10, proxies=requests_proxies, headers={"User-Agent": user_agent})
        if r.status_code == 200 and r.text.strip():
            lines = r.text.splitlines(); rp.parse(lines)
            crawl_delay = _extract_crawl_delay(lines, user_agent) or _extract_crawl_delay(lines, "*")
            logger.info(f"robots.txt loaded. Crawl-delay={crawl_delay if crawl_delay is not None else 'None'}")
        else:
            logger.warning(f"No usable robots.txt ({r.status_code}); defaulting to allow.")
            rp = None
    except Exception as e:
        logger.warning(f"Failed to load robots.txt ({e}); defaulting to allow.")
        rp = None
    return rp, crawl_delay, robots_url

def _extract_crawl_delay(lines: List[str], agent: str) -> Optional[float]:
    use = False
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"): continue
        if line.lower().startswith("user-agent:"):
            ua = line.split(":", 1)[1].strip(); use = (ua == agent)
        elif use and line.lower().startswith("crawl-delay:"):
            val = line.split(":", 1)[1].strip()
            try: return float(val)
            except ValueError: return None
        elif use and line.lower().startswith("user-agent:"):
            break
    return None

def _is_blocked_status(status: Optional[int]) -> bool:
    return status in (403, 429, 503)

def _looks_like_block(text: str) -> bool:
    t = (text or "").lower()
    return any(s in t for s in (
        "access denied", "too many requests", "captcha",
        "unusual traffic", "verify you are a human", "just a moment"
    ))

# ---------- single page scrape ----------
def _scrape_current_page(page, url: str, report_id: str, screenshot_dir: str, screenshot_rel_base: str):
    """Return (scraping_info, abuse_flags, final_url, redirect_chain, was_blocked)"""
    os.makedirs(screenshot_dir, exist_ok=True)
    logger.info(f"Navigating to {url} with 15s timeout...")
    response = page.goto(url, wait_until="domcontentloaded", timeout=15000)
    if not response:
        raise RuntimeError("No response from page.goto")
    page.wait_for_timeout(1200)
    final_url = page.url
    status = response.status
    ct = (response.headers or {}).get("content-type", "")
    logger.debug(f"Final URL: {final_url} | status={status} | content-type={ct}")

    # Redirect chain
    req_chain = []
    req = response.request
    while req and req.redirected_from:
        req = req.redirected_from
        req_chain.append(req.url)
    redirect_chain = list(reversed(req_chain)) + [final_url]

    # Screenshot
    fname = _sanitize_for_filename(final_url or url)
    screenshot_abs_path = os.path.join(screenshot_dir, fname)
    screenshot_rel_path = os.path.join(screenshot_rel_base, fname).replace("\\", "/")
    try:
        page.screenshot(path=screenshot_abs_path, full_page=True)
    except Exception as e:
        logger.warning(f"Screenshot failed for {final_url}: {e}")

    # Parse only HTML
    is_html = ("text/html" in ct) or (ct == "")
    html_raw = page.content() if is_html else ""
    html_bytes = html_raw.encode("utf-8") if html_raw else b""
    html_hash = _sha256(html_bytes) if html_bytes else None
    soup = BeautifulSoup(html_raw, "html.parser") if html_raw else BeautifulSoup("", "html.parser")

    if not is_html:
        scraping_info = {
            "url": final_url,
            "title": "(non-HTML content)",
            "htmlHash": None,
            "htmlBytes": 0,
            "screenshotPath": screenshot_rel_path,
            "headingsCount": 0,
            "linksCount": 0,
            "formsCount": 0,
            "structuredInfo": {"headings": [], "links": [], "forms": []},
        }
        abuse_flags = {
            "url": final_url,
            "suspiciousJS": [],
            "suspiciousJsCount": 0,
            "obfuscatedScripts": False,
            "redirectChain": redirect_chain,
            "usesMetaRefresh": False,
            "suspiciousInlineEvents": [],
            "httpStatus": status,
            "contentType": ct,
        }
        blocked = _is_blocked_status(status)
        return scraping_info, abuse_flags, final_url, redirect_chain, blocked

    # HTML extraction
    headings = [h.get_text(strip=True) for h in soup.find_all(['h1','h2','h3'])]
    links = extract_links(soup, final_url or url)
    forms = [urljoin(final_url or url, f.get('action', '')) for f in soup.find_all('form')]

    suspicious_inline_events = []
    for tag in soup.find_all():
        events = {k: v for k, v in tag.attrs.items() if isinstance(k, str) and k.lower().startswith("on")}
        if events:
            suspicious_inline_events.append(events)

    suspicious_js, obfuscated_found = [], False
    for s in soup.find_all('script'):
        try:
            txt = s.string or ""
            if any(kw in txt for kw in ('eval','document.write','setTimeout')):
                suspicious_js.append(txt[:200])
            if any(kw in txt for kw in ('base64','charCodeAt','atob(','fromCharCode')):
                obfuscated_found = True
        except Exception:
            continue

    meta_refresh = soup.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'})
    uses_meta_refresh = meta_refresh is not None

    blocked = _is_blocked_status(status) or _looks_like_block((html_raw or "")[:1200])

    scraping_info = {
        "url": final_url,
        "title": soup.title.string.strip() if soup.title and soup.title.string else "No title",
        "htmlHash": html_hash,
        "htmlBytes": len(html_bytes),
        "screenshotPath": screenshot_rel_path,
        "headingsCount": len(headings),
        "linksCount": len(links),
        "formsCount": len(forms),
        # keep trimmed investigator-friendly data
        "structuredInfo": {
            "headings": headings[:50],
            "links": links[:200],
            "forms": forms[:50],
        },
    }
    abuse_flags = {
        "url": final_url,
        "suspiciousJS": suspicious_js[:50],
        "suspiciousJsCount": len(suspicious_js),
        "obfuscatedScripts": obfuscated_found,
        "redirectChain": redirect_chain[:20],
        "usesMetaRefresh": uses_meta_refresh,
        "suspiciousInlineEvents": suspicious_inline_events[:50],
        "httpStatus": status,
        "contentType": ct,
    }
    return scraping_info, abuse_flags, final_url, redirect_chain, blocked



# ---------- multi-page crawl with UA/proxy rotation + fingerprint ----------
def perform_crawl(
    start_url: str,
    report_id: str,
    max_pages: int = 10,
    max_depth: int = 2,
    include_subdomains: bool = False,
    user_agent: str = "BRADBot/1.0",     # fallback/default UA
    crawl_delay_default: float = 1.0,
    proxy_getter = None,                  # () -> 'http://ip:port' | None
    user_agent_getter = None,             # () -> UA string | None
    delay_jitter: tuple[float, float] = (0.7, 1.4),
    rotate_ua_every_n: int = 5,
    rotate_ua_on_block: bool = True,
) -> Tuple[dict, dict]:
    start_url = normalize_url(start_url)
    start_url = urldefrag(start_url)[0]
    screenshot_dir = "/app/screenshots"
    screenshot_rel_base = "screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    logger.info(f"[Crawl Start] start_url={start_url} | report_id={report_id}")

    ua_pool = UserAgentPool() if not user_agent_getter else None

    def _pick_ua() -> str:
        if user_agent_getter:
            return user_agent_getter()
        if ua_pool:
            return ua_pool.next()
        return user_agent

    scraping_pages: List[dict] = []
    abuse_pages: List[dict] = []
    visited: Set[str] = set()
    queue: List[Tuple[str, int]] = [(start_url, 0)]

    with sync_playwright() as pw:
        net = NetworkCollector()
        proxy_str = proxy_getter() if proxy_getter else None
        current_ua = _pick_ua()
        fp = generate_fingerprint(current_ua, randomize=True)

        # HEADLESS + STEALTH
        browser, context, page = build_context_and_page(
            pw, proxy_str, fp, headless=True, use_stealth=True
        )
        net.wire(page)

        # robots
        rp, crawl_delay, robots_url = _load_robots(start_url, current_ua, None)
        effective_delay = min(max(crawl_delay if crawl_delay is not None else crawl_delay_default, 0.0), 5.0)
        proxy_failures = 0
        backoff = Backoff(base=1.5, max_sleep=15.0, jmin=delay_jitter[0], jmax=delay_jitter[1])
        pages_since_ua_rotate = 0

        try:
            while queue and len(visited) < max_pages:
                url, depth = queue.pop(0)
                if not _is_http_url(url) or url in visited: continue
                if not _same_site_ok(start_url, url, include_subdomains): continue
                if rp and not rp.can_fetch(current_ua, url):
                    logger.info(f"robots.txt disallows: {url}")
                    continue

                attempts = 0
                while True:
                    attempts += 1
                    try:
                        s, flags, final_url, chain, blocked = _scrape_current_page(
                            page, url, report_id, screenshot_dir, screenshot_rel_base
                        )
                        s["redirectChain"] = chain
                        s["finalUrl"] = final_url

                        if blocked and rotate_ua_on_block:
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception: pass
                            current_ua = _pick_ua()
                            fp = generate_fingerprint(current_ua, randomize=True)
                            new_proxy = proxy_getter() if proxy_getter else None
                            browser, context, page = build_context_and_page(
                                pw, new_proxy, fp, headless=True, use_stealth=True
                            )
                            net.wire(page)  # reattach listeners
                            rp, crawl_delay, robots_url = _load_robots(start_url, current_ua, None)
                            effective_delay = min(max(crawl_delay if crawl_delay is not None else crawl_delay_default, 0.0), 5.0)
                            backoff.sleep()
                            continue  # retry same URL

                        # success
                        scraping_pages.append(s)
                        abuse_pages.append(flags)
                        visited.add(url)
                        pages_since_ua_rotate += 1
                        backoff.reset()

                        # attach per-page network list (trimmed)
                        page_network = net.flush_page()
                        s["network"] = [
                            {k: r[k] for k in ("url","domain","method","status","resourceType")}
                            for r in page_network[:200]
                        ]


                        # UA rotate every N pages (same proxy for stability)
                        if rotate_ua_every_n > 0 and pages_since_ua_rotate >= rotate_ua_every_n:
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception: pass
                            current_ua = _pick_ua()
                            fp = generate_fingerprint(current_ua, randomize=True)
                            browser, context, page = build_context_and_page(
                                pw, proxy_str, fp, headless=True, use_stealth=True
                            )
                            net.wire(page)
                            pages_since_ua_rotate = 0

                        # enqueue children
                        if depth < max_depth:
                            for link in s["structuredInfo"]["links"]:
                                if (link not in visited
                                    and _same_site_ok(start_url, link, include_subdomains)
                                    and _is_http_url(link)
                                    and (not rp or rp.can_fetch(current_ua, link))):
                                    queue.append((link, depth + 1))

                        jittered_sleep(effective_delay, *delay_jitter)
                        break

                    except Exception as e:
                        msg = str(e)
                        if "ERR_TUNNEL_CONNECTION_FAILED" in msg or "net::ERR_PROXY_CONNECTION_FAILED" in msg:
                            proxy_failures += 1
                            logger.warning(f"Proxy tunnel failure ({proxy_failures}): {msg}")
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception: pass
                            proxy_str = proxy_getter() if proxy_getter else None
                            current_ua = _pick_ua()
                            fp = generate_fingerprint(current_ua, randomize=True)
                            browser, context, page = build_context_and_page(
                                pw, proxy_str, fp, headless=True, use_stealth=True
                            )
                            net.wire(page)
                            if proxy_failures > 3:
                                try:
                                    page.close(); context.close(); browser.close()
                                except Exception: pass
                                logger.warning("Proxies unreliable — falling back to direct.")
                                proxy_str = None
                                browser, context, page = build_context_and_page(pw, None, fp)
                                net.wire(page)  # reattach listeners

                                proxy_getter = None
                            backoff.sleep()
                            continue

                        logger.error(f"Error crawling {url}: {e}", exc_info=True)
                        if attempts <= 2:
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception:
                                pass
                            current_ua = _pick_ua()
                            fp = generate_fingerprint(current_ua, randomize=True)
                            new_proxy = proxy_getter() if proxy_getter else None
                            browser, context, page = build_context_and_page(
                                pw, new_proxy, fp, headless=True, use_stealth=True
                            )
                            net.wire(page)

                            backoff.sleep()
                            continue
                        break

        finally:
            try:
                page.close(); context.close(); browser.close()
            except Exception:
                pass

        all_reqs = getattr(net, "all_reqs", [])
        domains = { r["domain"] for r in all_reqs if r.get("domain") }
        apex = (_hostname(start_url) or "").lstrip(".")
        subdomains = { d for d in domains if d and d != apex and _subdomain_of(d, apex) }
        size_kb = sum(len((r.get("url") or "").encode("utf-8")) for r in all_reqs) // 1024

        scraping_info = {
            "scan": {
                "startUrl": start_url,
                "submittedAt": datetime.now(timezone.utc).isoformat(),
                "userAgent": current_ua,
            },
            "summary": {
                "requests": len(all_reqs),
                "domains": len(domains),
                "subdomains": len(subdomains),
                "sizeKB": size_kb,
            },
            "network": {
                "requests": [
                    {k: r[k] for k in ("url","domain","method","status","resourceType")}
                    for r in all_reqs[:1000]
                ]
            },
            "pages": scraping_pages,
        }
        abuse_flags = {
            "robots": {"url": robots_url, "available": bool(rp), "respected": True, "crawlDelay": crawl_delay},
            "pages": abuse_pages,
        }
    logger.info(f"[Crawl Complete] pages={len(scraping_pages)} start={start_url}")
    return scraping_info, abuse_flags

# ---------- single page fallback ----------
def perform_scraping(domain: str, report_id: str) -> tuple:
    start_url = normalize_url(start_url)
    domain = normalize_url(domain)
    screenshot_dir = "/app/screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    logger.info(f"[Scraping Start] Domain: {domain} | Report ID: {report_id}")

    with sync_playwright() as pw:
        # basic fp for single scrape
        fp = generate_fingerprint(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            randomize=True
        )
        browser, context, page = build_context_and_page(
           pw, None, fp, headless=True, use_stealth=True
       )
        try:
            s, flags, *_ = _scrape_current_page(page, domain, report_id, screenshot_dir, "screenshots")
            scraping_info = {
                "scan": {
                    "startUrl": domain,
                    "submittedAt": datetime.now(timezone.utc).isoformat(),
                    "userAgent": fp.user_agent,
                },
                "summary": {
                    "requests": 1,
                    "domains": 1,
                    "subdomains": 0,
                    "sizeKB": max(1, s.get("htmlBytes", 0) // 1024),
                },
                "network": {"requests": []},
                "pages": [s],
            }
            abuse_flags = {"pages": [flags]}
            return scraping_info, abuse_flags
        except Exception as e:
            logger.error(f"[Scraping Error] {domain} failed with error: {e}", exc_info=True)
            return {}, {}
        finally:
            try:
                page.close(); context.close(); browser.close()
            except Exception:
                pass
