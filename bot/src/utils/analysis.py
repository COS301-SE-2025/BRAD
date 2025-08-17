from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
import urllib.robotparser as robotparser
import requests
import os, re, time, hashlib
from typing import Dict, List, Tuple, Optional, Set
from .logger import get_logger

logger = get_logger(__name__)

# ---------------------------- Existing risk score (unchanged) ----------------------------
def calculate_risk_score(scraping_info: dict, abuse_flags: dict) -> int:
    score = 0
    if abuse_flags.get("malwareDetected"): score += 50
    if abuse_flags.get("redirectChain"): score += 20
    if abuse_flags.get("obfuscatedScripts"): score += 20
    score += len(abuse_flags.get("suspiciousJS", [])) * 5
    score += abuse_flags.get("keywordMatches", 0) * 3
    if abuse_flags.get("similarityScore", 0) > 0.8: score += 15
    return min(max(score, 10), 100)

# ---------------------------- Helpers ----------------------------
def sanitize_for_filename(s: str) -> str:
    """Turn a URL into a short, safe filename."""
    s = urldefrag(s)[0]
    parsed = urlparse(s)
    path = parsed.path if parsed.path else "/"
    base = f"{parsed.netloc}{path}"
    base = re.sub(r'[^A-Za-z0-9._-]+', '_', base)
    # keep names reasonable & collision-safe
    h = hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]
    base = base.strip("_")[:80]
    return f"{base}_{h}.png"

class ProxyPool:
    """
    Accepts proxies like:
      - http://user:pass@host:port
      - socks5://host:port
      - host:port  (assumes http)
    Provides formats for Playwright and requests.
    """
    def __init__(self, proxies: Optional[List[str]] = None):
        raw = proxies or os.getenv("BRAD_PROXIES", "").split(",")
        self.items = [p.strip() for p in raw if p.strip()]
        self.idx = -1

    def has_proxies(self) -> bool:
        return len(self.items) > 0

    def next(self) -> Optional[dict]:
        if not self.items:
            return None
        self.idx = (self.idx + 1) % len(self.items)
        return self._to_playwright(self.items[self.idx])

    def current_requests_proxies(self) -> Optional[dict]:
        if not self.items or self.idx < 0:
            return None
        p = self.items[self.idx]
        if "://" not in p:
            p = f"http://{p}"
        return {"http": p, "https": p}

    @staticmethod
    def _to_playwright(p: str) -> dict:
        if "://" not in p:
            p = f"http://{p}"
        u = urlparse(p)
        conf = {"server": f"{u.scheme}://{u.hostname}:{u.port}"}
        if u.username:
            conf["username"] = u.username
        if u.password:
            conf["password"] = u.password
        return conf

def load_robots(start_url: str, user_agent: str, requests_proxies: Optional[dict]) -> Tuple[Optional[robotparser.RobotFileParser], Optional[float], str]:
    parsed = urlparse(start_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = robotparser.RobotFileParser()
    crawl_delay = None
    try:
        logger.info(f"Fetching robots.txt: {robots_url}")
        r = requests.get(robots_url, timeout=10, proxies=requests_proxies, headers={"User-Agent": user_agent})
        if r.status_code == 200 and r.text.strip():
            lines = r.text.splitlines()
            rp.parse(lines)
            # Very simple crawl-delay parse (robotparser doesn’t expose it)
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
        if not line or line.startswith("#"):
            continue
        if line.lower().startswith("user-agent:"):
            ua = line.split(":", 1)[1].strip()
            use = (ua == agent)
        elif use and line.lower().startswith("crawl-delay:"):
            val = line.split(":", 1)[1].strip()
            try:
                return float(val)
            except ValueError:
                return None
        # stop when next UA section begins
        elif use and line.lower().startswith("user-agent:"):
            break
    return None

def same_site_ok(base: str, target: str, include_subdomains: bool) -> bool:
    b = urlparse(base).netloc.lower()
    t = urlparse(target).netloc.lower()
    if b == t:
        return True
    if include_subdomains:
        # simple suffix check; for precise apex handling use tldextract (optional)
        return t.endswith("." + b)
    return False

def is_http_url(u: str) -> bool:
    return urlparse(u).scheme in ("http", "https")

def is_blocked(response, page_text: str) -> bool:
    status = response.status if response else None
    if status in (403, 429, 503):
        return True
    txt = (page_text or "")[:800].lower()
    signals = (
        "access denied", "forbidden", "too many requests", "captcha",
        "unusual traffic", "verify you are a human", "just a moment"
    )
    return any(s in txt for s in signals)

def extract_links(soup: BeautifulSoup, base_url: str) -> List[str]:
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:") or href.startswith("#"):
            continue
        full = urljoin(base_url, href)
        links.append(urldefrag(full)[0])
    return list(dict.fromkeys(links))  # de-dup, keep order

# ---------------------------- Single-page scrape (refactor of your core) ----------------------------
def scrape_current_page(page, url: str, report_id: str, screenshot_dir: str, screenshot_rel_base: str) -> Tuple[dict, dict, str, List[str]]:
    """
    Navigates to `url` on the provided page, extracts info, and saves a screenshot.
    Returns (scraping_info, abuse_flags, final_url, redirect_chain)
    """
    os.makedirs(screenshot_dir, exist_ok=True)
    logger.info(f"Navigating to {url} with 15s timeout...")
    response = page.goto(url, wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2000)
    final_url = page.url
    logger.debug(f"Final URL after load: {final_url}")

    # Redirect chain
    req_chain = []
    req = response.request if response else None
    while req and req.redirected_from:
        req = req.redirected_from
        req_chain.append(req.url)
    redirect_chain = list(reversed(req_chain)) + [final_url]
    logger.info(f"Redirect chain: {redirect_chain}")

    # Capture HTML and screenshot
    html_raw = page.content()
    soup = BeautifulSoup(html_raw, "html.parser")

    # screenshot path per page
    fname = sanitize_for_filename(final_url if final_url else url)
    screenshot_abs_path = os.path.join(screenshot_dir, fname)
    screenshot_rel_path = os.path.join(screenshot_rel_base, fname).replace("\\", "/")
    logger.debug(f"Saving screenshot to {screenshot_abs_path}...")
    page.screenshot(path=screenshot_abs_path, full_page=True)

    headings = [h.get_text(strip=True) for h in soup.find_all(['h1', 'h2', 'h3'])]
    links = extract_links(soup, final_url or url)
    forms = [urljoin(final_url or url, f.get('action', '')) for f in soup.find_all('form')]

    # Suspicious inline events
    suspicious_inline_events = []
    for tag in soup.find_all():
        events = {k: v for k, v in tag.attrs.items() if isinstance(k, str) and k.lower().startswith("on")}
        if events:
            suspicious_inline_events.append(events)

    # Suspicious/obfuscated JS
    suspicious_js = []
    obfuscated_found = False
    for s in soup.find_all('script'):
        try:
            script_text = s.string or ""
            if any(kw in script_text for kw in ['eval', 'document.write', 'setTimeout']):
                suspicious_js.append(script_text[:100])
            if any(kw in script_text for kw in ['base64', 'charCodeAt']):
                obfuscated_found = True
        except Exception:
            continue

    # Meta refresh
    meta_refresh = soup.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'})
    uses_meta_refresh = meta_refresh is not None

    scraping_info = {
        "url": final_url,
        "title": soup.title.string.strip() if soup.title and soup.title.string else "No title",
        "htmlRaw": html_raw,
        "screenshotPath": screenshot_rel_path,  # relative path e.g. "screenshots/<file>.png"
        "structuredInfo": {
            "headings": headings,
            "links": links,
            "forms": forms,
        },
    }

    abuse_flags = {
        "url": final_url,
        "suspiciousJS": suspicious_js,
        "obfuscatedScripts": obfuscated_found,
        "redirectChain": redirect_chain,
        "usesMetaRefresh": uses_meta_refresh,
        "suspiciousInlineEvents": suspicious_inline_events,
    }

    return scraping_info, abuse_flags, final_url, redirect_chain

# ---------------------------- New: polite multi-page crawler ----------------------------
def perform_crawl(
    start_url: str,
    report_id: str,
    max_pages: int = 10,
    max_depth: int = 2,
    include_subdomains: bool = False,
    user_agent: str = "BRADBot/1.0",
    crawl_delay_default: float = 1.0,
    proxies: Optional[List[str]] = None,
) -> Tuple[dict, dict]:
    """
    Crawl starting at start_url (same site, optional subdomains), obey robots.txt,
    screenshot each page, and rotate proxies if blocked.

    Returns (scraping_info, abuse_flags):
      scraping_info = {
        "startUrl": ...,
        "pages": [ {url, title, screenshotPath, structuredInfo{...}, htmlRaw}, ... ]
      }
      abuse_flags = {
        "robots": {"url": robots_url, "respected": bool, "crawlDelay": seconds},
        "pages": [ {url, redirectChain, suspiciousJS, ...}, ... ]
      }
    """
    screenshot_dir = "/app/screenshots"
    screenshot_rel_base = "screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)

    start_url = urldefrag(start_url)[0]
    logger.info(f"[Crawl Start] start_url={start_url} | report_id={report_id}")

    pool = ProxyPool(proxies)
    proxy_cfg = pool.next()  # may be None

    def launch_browser():
        logger.debug(f"Launching headless Chromium with proxy={proxy_cfg}")
        return p.chromium.launch(headless=True, proxy=proxy_cfg)

    scraping_pages: List[dict] = []
    abuse_pages: List[dict] = []

    visited: Set[str] = set()
    queue: List[Tuple[str, int]] = [(start_url, 0)]

    respected_robots = True
    rp = None
    crawl_delay = None
    robots_url = ""

    with sync_playwright() as p:
        browser = launch_browser()
        context = browser.new_context(user_agent=user_agent)
        page = context.new_page()

        # robots.txt for the current origin
        rp, crawl_delay, robots_url = load_robots(start_url, user_agent, pool.current_requests_proxies())
        effective_delay = crawl_delay if crawl_delay is not None else crawl_delay_default

        try:
            while queue and len(visited) < max_pages:
                url, depth = queue.pop(0)
                if not is_http_url(url):
                    continue
                if url in visited:
                    continue
                if not same_site_ok(start_url, url, include_subdomains):
                    continue

                # robots gate
                if rp and not rp.can_fetch(user_agent, url):
                    logger.info(f"robots.txt disallows: {url}")
                    respected_robots = True
                    continue

                # Try navigation with simple retry & proxy rotation on block
                attempts = 0
                while True:
                    attempts += 1
                    try:
                        scraping_info, flags, final_url, chain = scrape_current_page(
                            page, url, report_id, screenshot_dir, screenshot_rel_base
                        )
                        blocked = is_blocked(page.response(), scraping_info.get("htmlRaw", ""))
                        if blocked and pool.has_proxies():
                            logger.warning(f"Blocked at {url}. Rotating proxy and retrying...")
                            # rotate proxy: recreate browser/context/page
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception:
                                pass
                            proxy_cfg_local = pool.next()
                            browser = p.chromium.launch(headless=True, proxy=proxy_cfg_local)
                            context = browser.new_context(user_agent=user_agent)
                            page = context.new_page()
                            # re-check robots with the new proxy (for sites that gate robots)
                            rp, crawl_delay, robots_url = load_robots(start_url, user_agent, pool.current_requests_proxies())
                            effective_delay = crawl_delay if crawl_delay is not None else crawl_delay_default
                            if attempts <= len(pool.items) + 1:
                                continue  # retry current URL
                        # success path
                        scraping_pages.append(scraping_info)
                        abuse_pages.append(flags)
                        visited.add(url)
                        logger.info(f"[Crawled] {url} (depth {depth})")

                        # enqueue children
                        if depth < max_depth:
                            for link in scraping_info["structuredInfo"]["links"]:
                                if (link not in visited
                                    and same_site_ok(start_url, link, include_subdomains)
                                    and is_http_url(link)
                                    and (not rp or rp.can_fetch(user_agent, link))):
                                    queue.append((link, depth + 1))
                        # be polite
                        if effective_delay and effective_delay > 0:
                            time.sleep(min(effective_delay, 5.0))
                        break
                    except Exception as e:
                        logger.error(f"Error crawling {url}: {e}", exc_info=True)
                        # rotate proxy once if available
                        if pool.has_proxies():
                            try:
                                page.close(); context.close(); browser.close()
                            except Exception:
                                pass
                            proxy_cfg_local = pool.next()
                            browser = p.chromium.launch(headless=True, proxy=proxy_cfg_local)
                            context = browser.new_context(user_agent=user_agent)
                            page = context.new_page()
                            if attempts <= len(pool.items) + 1:
                                continue
                        # give up this URL
                        break

        finally:
            try:
                page.close(); context.close(); browser.close()
            except Exception:
                pass

    scraping_info = {
        "startUrl": start_url,
        "userAgent": user_agent,
        "pages": scraping_pages,
    }
    abuse_flags = {
        "robots": {
            "url": robots_url,
            "respected": respected_robots,
            "crawlDelay": crawl_delay,
        },
        "pages": abuse_pages,
    }

    logger.info(f"[Crawl Complete] pages={len(scraping_pages)} start={start_url}")
    return scraping_info, abuse_flags

# ---------------------------- Backwards-compatible single page (kept) ----------------------------
def perform_scraping(domain: str, report_id: str) -> tuple:
    """
    Keeps your original single-page behavior for places where you still call perform_scraping().
    """
    screenshot_dir = "/app/screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)

    filename = f"{report_id}_{int(time.time())}.png"
    screenshot_rel_path = f"screenshots/{filename}"
    screenshot_abs_path = os.path.join(screenshot_dir, filename)

    logger.info(f"[Scraping Start] Domain: {domain} | Report ID: {report_id}")

    with sync_playwright() as p:
        logger.debug("Launching headless Chromium...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        redirect_chain = []

        try:
            logger.info(f"Navigating to {domain} with 15s timeout...")
            response = page.goto(domain, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2000)
            final_url = page.url
            logger.debug(f"Final URL after load: {final_url}")

            # Capture redirect chain
            req_chain = []
            req = response.request if response else None
            while req and req.redirected_from:
                req = req.redirected_from
                req_chain.append(req.url)
            redirect_chain = list(reversed(req_chain)) + [final_url]
            logger.info(f"Redirect chain: {redirect_chain}")

            # Capture HTML and screenshot
            logger.debug("Extracting HTML content...")
            html_raw = page.content()
            logger.debug(f"Saving screenshot to {screenshot_abs_path}...")
            page.screenshot(path=screenshot_abs_path, full_page=True)

            # Parse HTML
            soup = BeautifulSoup(html_raw, "html.parser")
            headings = [h.get_text(strip=True) for h in soup.find_all(['h1', 'h2', 'h3'])]
            links = [urljoin(domain, a['href']) for a in soup.find_all('a', href=True)]
            forms = [urljoin(domain, f.get('action', '')) for f in soup.find_all('form')]
            logger.debug(f"Found {len(headings)} headings, {len(links)} links, {len(forms)} forms.")

            # Detect suspicious inline events
            suspicious_inline_events = []
            for tag in soup.find_all():
                events = {k: v for k, v in tag.attrs.items() if k.startswith("on")}
                if events:
                    suspicious_inline_events.append(events)
            if suspicious_inline_events:
                logger.warning(f"Detected {len(suspicious_inline_events)} suspicious inline event(s).")

            # Detect suspicious JS and obfuscation
            suspicious_js = []
            obfuscated_found = False
            for s in soup.find_all('script'):
                try:
                    script_text = s.string or ""
                    if any(kw in script_text for kw in ['eval', 'document.write', 'setTimeout']):
                        suspicious_js.append(script_text[:100])
                    if any(kw in script_text for kw in ['base64', 'charCodeAt']):
                        obfuscated_found = True
                except Exception:
                    continue
            if suspicious_js:
                logger.warning(f"Detected {len(suspicious_js)} suspicious JS snippets.")
            if obfuscated_found:
                logger.warning("Detected obfuscated JavaScript.")

            # Meta refresh check
            meta_refresh = soup.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'})
            uses_meta_refresh = meta_refresh is not None
            if uses_meta_refresh:
                logger.warning("Detected meta refresh tag.")

            scraping_info = {
                "title": soup.title.string.strip() if soup.title and soup.title.string else "No title",
                "htmlRaw": html_raw,
                "screenshotPath": screenshot_rel_path,  # only relative path!
                "structuredInfo": {
                    "headings": headings,
                    "links": links,
                    "forms": forms,
                },
                "crawledLinks": links[:5],
            }

            abuse_flags = {
                "suspiciousJS": suspicious_js,
                "obfuscatedScripts": obfuscated_found,
                "redirectChain": redirect_chain,
                "usesMetaRefresh": uses_meta_refresh,
                "suspiciousInlineEvents": suspicious_inline_events,
            }

            logger.info(f"[Scraping Complete] Domain: {domain} | Report ID: {report_id}")
            return scraping_info, abuse_flags

        except Exception as e:
            logger.error(f"[Scraping Error] {domain} failed with error: {e}", exc_info=True)
            return {}, {}

        finally:
            logger.debug("Closing browser...")
            browser.close()
