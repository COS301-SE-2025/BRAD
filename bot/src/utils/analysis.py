from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def calculate_risk_score(scraping_info: dict, abuse_flags: dict) -> int:
    score = 0

    # Heavily weighted red flags
    if abuse_flags.get("malwareDetected"):
        score += 50
    if abuse_flags.get("redirectChain", False):
        score += 20
    if abuse_flags.get("obfuscatedScripts", False):
        score += 20

    # Suspicious JavaScript
    suspicious_js = abuse_flags.get("suspiciousJS", [])
    score += len(suspicious_js) * 5  # 5 points per suspicious JS snippet

    # Keyword match (phishing indicators)
    keyword_matches = abuse_flags.get("keywordMatches", 0)
    score += keyword_matches * 3

    # Similarity to real domains (e.g., absa.co.za)
    if abuse_flags.get("similarityScore", 0) > 0.8:
        score += 15

    # Fallback minimum/maximum
    score = max(score, 10)  # Ensure at least 10 if anything is suspicious
    score = min(score, 100)  # Cap at 100

    return score

def perform_scraping(domain: str) -> tuple:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        redirect_chain = []

        try:
            response = page.goto(domain, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2000)  # Allow JS to run
            final_url = page.url

            # Handle redirect chain manually
            req_chain = []
            req = response.request if response else None
            while req and req.redirected_from:
                req = req.redirected_from
                req_chain.append(req.url)
            redirect_chain = list(reversed(req_chain)) + [final_url]

            # Get content and screenshot
            html_raw = page.content()
            page.screenshot(path="/tmp/screenshot.png", full_page=True)

            soup = BeautifulSoup(html_raw, "html.parser")

            # Extract headings
            headings = [h.get_text(strip=True) for h in soup.find_all(['h1', 'h2', 'h3'])]

            # Extract and resolve links
            links = [urljoin(domain, a['href']) for a in soup.find_all('a', href=True)]

            # Extract form actions
            forms = [urljoin(domain, f.get('action', '')) for f in soup.find_all('form')]

            # Detect suspicious inline JS events
            suspicious_inline_events = []
            for tag in soup.find_all():
                events = {k: v for k, v in tag.attrs.items() if k.startswith("on")}
                if events:
                    suspicious_inline_events.append(events)

            # Detect suspicious or obfuscated scripts
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

            # Detect meta refresh redirect
            meta_refresh = soup.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'})
            uses_meta_refresh = meta_refresh is not None

            # Compose result dictionaries
            scraping_info = {
                "title": soup.title.string.strip() if soup.title and soup.title.string else "No title",
                "htmlRaw": html_raw,
                "screenshotPath": "/tmp/screenshot.png",
                "structuredInfo": {
                    "headings": headings,
                    "links": links,
                    "forms": forms,
                },
                "crawledLinks": links[:5],  # Can later be expanded by recursive crawling
            }

            abuse_flags = {
                "suspiciousJS": suspicious_js,
                "obfuscatedScripts": obfuscated_found,
                "redirectChain": redirect_chain,
                "usesMetaRefresh": uses_meta_refresh,
                "suspiciousInlineEvents": suspicious_inline_events,
            }

            return scraping_info, abuse_flags

        finally:
            browser.close()
