from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
import time
from .logger import get_logger

logger = get_logger(__name__)

def calculate_risk_score(scraping_info: dict, abuse_flags: dict) -> int:
    score = 0
    if abuse_flags.get("malwareDetected"): score += 50
    if abuse_flags.get("redirectChain"): score += 20
    if abuse_flags.get("obfuscatedScripts"): score += 20
    score += len(abuse_flags.get("suspiciousJS", [])) * 5
    score += abuse_flags.get("keywordMatches", 0) * 3
    if abuse_flags.get("similarityScore", 0) > 0.8: score += 15
    return min(max(score, 10), 100)

def perform_scraping(domain: str, report_id: str) -> tuple:
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
