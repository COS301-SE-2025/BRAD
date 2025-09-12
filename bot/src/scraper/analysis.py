from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import os, time, hashlib, threading, requests
from urllib import robotparser
from collections import Counter
import re
from statistics import mean

from datetime import datetime
from .network_tracker import NetworkTracker
from src.utils.logger import get_logger


logger = get_logger(__name__)

DEFAULT_UA = "BRADBot/1.0 (+https://example.invalid/bot) Playwright"
REQUESTS_SAMPLE_LIMIT = 1000
ALLOWED_SCHEMES = {"http", "https"}

# --- scoring helpers / constants ---
BENIGN_TRAINING_DOMAINS = {
    "books.toscrape.com", "toscrape.com", "httpbin.org", "example.com"
}

OBFUSCATION_PATTERNS = [
    r"\beval\s*\(",
    r"\bFunction\s*\(",
    r"atob\s*\(\s*['\"][A-Za-z0-9+/]{40,}={0,2}['\"]\s*\)",
    r"String\.fromCharCode\(\s*(\d{2,3}\s*,\s*){5,}\d{2,3}\s*\)",
]

def _is_benign_jquery_fallback(txt: str) -> bool:
    if not txt: return False
    t = txt.lower()
    return ("window.jquery" in t and "document.write" in t and "jquery" in t and "<script" in t)

def _looks_obfuscated_js(txt: str) -> bool:
    if not txt: return False
    if _is_benign_jquery_fallback(txt):
        return False
    return any(re.search(p, txt, re.I) for p in OBFUSCATION_PATTERNS)

def _risk_level(score: int) -> str:
    if score <= 19: return "Low"
    if score <= 49: return "Medium"
    return "High"

def _clamp(v: int, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, v))

def _dedupe_requests_log(log):
    seen, out = set(), []
    for r in log:
        key = (r.get("url"), r.get("method"), r.get("status"), r.get("resourceType"))
        if key in seen: 
            continue
        seen.add(key)
        out.append(r)
    return out

def _mixed_content_counts(page_scheme: str, responses: list) -> int:
    """Count HTTP subresource loads on an HTTPS page."""
    if page_scheme != "https": 
        return 0
    c = 0
    for r in responses:
        try:
            if r.get("protocol") == "http":
                c += 1
        except Exception:
           pass
    return c

def _origin(url: str) -> str:
    p = urlparse(url)
    return f"{p.scheme}://{p.netloc}"

def _load_robots(origin: str, user_agent: str, timeout=8) -> robotparser.RobotFileParser:
    rp = robotparser.RobotFileParser()
    robots_url = urljoin(origin, "/robots.txt")
    try:
        r = requests.get(robots_url, timeout=timeout, headers={"User-Agent": user_agent})
        if r.status_code >= 400:
            logger.info(f"[Robots] {robots_url} not available (status {r.status_code}); allow-all.")
            rp.parse("")
        else:
            rp.parse(r.text.splitlines())
    except Exception as e:
        logger.warning(f"[Robots] Failed to fetch robots.txt: {e}; allow-all.")
        rp.parse("")
    rp.set_url(robots_url)
    return rp

def _allowed_by_robots(rp: robotparser.RobotFileParser, ua: str, url: str) -> bool:
    try:
        return rp.can_fetch(ua, url)
    except Exception:
        return True

def _same_origin(a: str, b: str) -> bool:
    return urlparse(a).netloc == urlparse(b).netloc and urlparse(a).scheme == urlparse(b).scheme

def _hash_html(html: str) -> str:
    return hashlib.sha256(html.encode("utf-8", errors="ignore")).hexdigest()

SUSPICIOUS_KEYWORDS = [
    "login","password","verify","reset","wallet","seed","mnemonic","2fa",
    "bank","update account","confirm","urgent","limited time","prize"
]
JS_OBFUSCATION_HINTS = [
    "atob(","btoa(","fromCharCode","charCodeAt","unescape(","eval(","Function(",
    "while(true)","setTimeout(","setInterval(","document.write(","window.location="
]

def _score_keywords(text: str) -> int:
    t = text.lower()
    return sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in t)

def _extract_structured(soup: BeautifulSoup, base_url: str):
    headings = [h.get_text(strip=True) for h in soup.find_all(['h1','h2','h3'])]
    links = [urljoin(base_url, a['href']) for a in soup.find_all('a', href=True)]
    forms = [urljoin(base_url, f.get('action','')) for f in soup.find_all('form')]
    return headings, links, forms

def _inspect_page_for_flags(soup: BeautifulSoup):
    suspicious_inline_events = []
    for tag in soup.find_all():
        ev = {k:v for k,v in tag.attrs.items() if isinstance(k,str) and k.startswith("on")}
        if ev: suspicious_inline_events.append(ev)

    suspicious_js, obfuscated_found = [], False
    for s in soup.find_all('script'):
        try:
            txt = s.string or ""
            if _looks_obfuscated_js(txt):
                obfuscated_found = True
            if (("eval(" in txt) or ("setTimeout(" in txt) or ("document.write(" in txt)) and not _is_benign_jquery_fallback(txt):
                suspicious_js.append(txt[:160])
        except Exception:
            continue

    meta_refresh = soup.find('meta', attrs={'http-equiv': lambda x: x and x.lower() == 'refresh'}) is not None
    return suspicious_inline_events, suspicious_js, obfuscated_found, meta_refresh

def perform_scraping(
    start_url: str,
    report_id: str,
    *,
    max_pages: int = 12,
    max_depth: int = 2,
    delay_seconds: float = 1.5,
    obey_robots: bool = True,
    user_agent: str = DEFAULT_UA,
    calculate_risk_score=None,  # inject if you want; else fallback
):
    """
    Returns (scraping_info, abuse_flags)
    """
    if calculate_risk_score is None:
        def calculate_risk_score(page_ctx, agg_ctx):
            f = page_ctx.get("flags", {})
            redirect_len = page_ctx.get("redirect_chain_len", 0)
            host = (page_ctx.get("hostname") or "").lower()
            mixed_on_https = int(page_ctx.get("mixed_on_https", 0))
            err_cnt = int(page_ctx.get("error_count", 0))
            csp_upgrade = bool(page_ctx.get("doc_csp_upgrade", False))

            score = 5
            reasons = []

            if f.get("malwareDetected"):
                score += 70; reasons.append("Malware indicator")
            if f.get("obfuscatedScripts"):
                score += 25; reasons.append("Obfuscated JS detected")

            js_count = len(f.get("suspiciousJS", []))
            if js_count:
                bump = min(15, js_count * 5)
                score += bump; reasons.append(f"{js_count} suspicious JS snippet(s) (+{bump})")
            if f.get("usesMetaRefresh"):
                score += 15; reasons.append("Meta refresh")
            if redirect_len > 1:
                score += 10; reasons.append(f"Redirect chain length={redirect_len}")

            km = int(f.get("keywordMatches", 0))
            if km:
                bump = min(12, km * 3)
                score += bump; reasons.append(f"Keyword hints x{km} (+{bump})")

            if mixed_on_https:
                bump = min(10, 2 * mixed_on_https)
                score += bump
                reasons.append(f"HTTP subresource(s) on HTTPS page x{mixed_on_https} (+{bump})")
                if csp_upgrade:
                    score = max(5, score - 5)
                    reasons.append("CSP upgrade-insecure-requests mitigates mixed content")
            if err_cnt:
                bump = min(10, err_cnt * 2)
                score += bump
                reasons.append(f"{err_cnt} error response(s) (+{bump})")

            score = _clamp(score, 5, 100)
            if host in BENIGN_TRAINING_DOMAINS:
                old = score
                score = max(5, int(score * 0.6))
                reasons.append(f"Training domain bias: {host} ({old}→{score})")
            return score, reasons

    screenshot_dir = "/app/screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)

    origin = _origin(start_url)
    logger.info(f"[Crawl Start] {start_url} (origin={origin}) | Report={report_id}")

    rp = _load_robots(origin, user_agent) if obey_robots else None

    pages_out, screenshots_all, all_requests_sample = [], [], []
    global_redirects, visited_urls, visited_hashes = {}, set(), set()
    frontier = [(start_url, 0)]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=user_agent)
        page = context.new_page()

        req_lock = threading.Lock()
        # Per-page buffers
        current_buffers = {"reqs": [], "resps": [], "tracker": NetworkTracker()}


        req_lock = threading.Lock()
        current_buffers = {"reqs": [], "resps": [], "tracker": NetworkTracker()}

        def on_request(req):
            nonlocal all_requests_sample, current_buffers
            entry = {"url": req.url, "method": req.method, "resourceType": req.resource_type}
            with req_lock:
                # tracker
                tr = current_buffers["tracker"]
                tr.mark_start()
                tr.requests_total += 1
                try:
                    if (page.url or "").startswith("https://") and req.url.startswith("http://"):
                        tr.http_on_https_attempts += 1
                except Exception:
                    pass
                # sampling
                if len(all_requests_sample) < REQUESTS_SAMPLE_LIMIT:
                    all_requests_sample.append(entry)
                    current_buffers["reqs"].append(entry)

        def on_response(resp):
            nonlocal all_requests_sample, current_buffers
            try:
                entry = {
                    "url": resp.url,
                    "method": resp.request.method,
                    "resourceType": resp.request.resource_type,
                    "status": resp.status,
                    "protocol": urlparse(resp.url).scheme
                }
            except Exception:
                entry = {"url": resp.url, "status": resp.status}
            with req_lock:
                # tracker
                tr = current_buffers["tracker"]
                tr.responses_total += 1
                try:
                    tr.status_counts[resp.status] = tr.status_counts.get(resp.status, 0) + 1
                    if isinstance(resp.status, int) and resp.status >= 400:
                        tr.error_count += 1
                except Exception:
                    pass
                tr.mark_end()
                # sampling
                if len(all_requests_sample) < REQUESTS_SAMPLE_LIMIT:
                    all_requests_sample.append(entry)
                current_buffers["resps"].append(entry)

        def on_request_failed(req):
            with req_lock:
                tr = current_buffers["tracker"]
                tr.error_count += 1
                tr.mark_end()

        page.on("request", on_request)
        page.on("response", on_response)
        page.on("requestfailed", on_request_failed)

        try:
            while frontier and len(pages_out) < max_pages:
                url, depth = frontier.pop(0)
                parsed = urlparse(url)
                if parsed.scheme not in ALLOWED_SCHEMES: continue
                if not _same_origin(origin, url): continue
                if url in visited_urls: continue
                if obey_robots and rp and not _allowed_by_robots(rp, user_agent, url):
                    logger.info(f"[Robots] Disallow: {url}")
                    continue

                visited_urls.add(url)
                # reset per-page buffers
                current_buffers["reqs"] = []
                current_buffers["resps"] = []
                current_buffers["tracker"] = NetworkTracker()

                try:
                    resp = page.goto(url, wait_until="domcontentloaded", timeout=15000)
                    page.wait_for_timeout(800)
                except Exception as e:
                    logger.warning(f"[Nav Error] {url}: {e}")
                    continue

                final_url = page.url
                chain = []
                req = resp.request if resp else None
                while req and req.redirected_from:
                    req = req.redirected_from
                    chain.append(req.url)
                chain = list(reversed(chain)) + [final_url]
                global_redirects[url] = chain

                
                # Document CSP (mitigation signal)
                doc_csp = ""
                try:
                    if resp:
                        headers = resp.headers or {}
                        doc_csp = headers.get("content-security-policy", "") or headers.get("Content-Security-Policy", "")
                except Exception:
                    pass
                doc_csp_upgrade = "upgrade-insecure-requests" in doc_csp.lower()

                # Per-page network summary
                page_responses = list(current_buffers["resps"])
                http_on_https = _mixed_content_counts(urlparse(final_url).scheme or "", page_responses)
                error_count = sum(1 for r in page_responses if isinstance(r.get("status"), int) and 400 <= r["status"] < 600)

                tr = current_buffers["tracker"]
                page_network_summary = tr.to_summary()
                page_network_summary.update({
                    "responsesSampled": len(page_responses),
                    "errorCount": error_count,
                    "httpOnHttps": http_on_https,
                })

                ts = int(time.time())
                fname = f"{report_id}_{len(pages_out)+1}_{ts}.png"
                screenshot_rel = f"screenshots/{fname}"
                screenshot_abs = os.path.join(screenshot_dir, fname)
                try:
                    page.screenshot(path=screenshot_abs, full_page=True)
                    screenshots_all.append(screenshot_rel)
                except Exception as e:
                    logger.warning(f"[Screenshot Failed] {final_url}: {e}")

                try:
                    html_raw = page.content()
                except Exception as e:
                    logger.warning(f"[Content Failed] {final_url}: {e}")
                    html_raw = ""

                html_hash = _hash_html(html_raw)
                dedup = html_hash in visited_hashes
                visited_hashes.add(html_hash)

                soup = BeautifulSoup(html_raw, "html.parser")
                title = soup.title.string.strip() if soup.title and soup.title.string else "No title"

                headings, links, forms = _extract_structured(soup, final_url)
                susp_inline, susp_js, obfus, meta_refresh = _inspect_page_for_flags(soup)
                keyword_hits = _score_keywords((title or "") + " " + " ".join(headings))

                flags = {
                    "suspiciousJS": susp_js,
                    "obfuscatedScripts": obfus,
                    "usesMetaRefresh": meta_refresh,
                    "suspiciousInlineEvents": susp_inline,
                    "redirectChain": chain,
                    "keywordMatches": keyword_hits,
                    "malwareDetected": False,
                    "httpOnHttpsCount": http_on_https,
                    "errorResponses": error_count,
                    "docCspHasUpgradeInsecureRequests": doc_csp_upgrade,
                }

                redirect_chain_len = len(chain)  # 1 means no real redirect
                hostname = urlparse(final_url).hostname or ""
                page_risk, reasons = calculate_risk_score(
                    {
                        "flags": flags,
                        "redirect_chain_len": redirect_chain_len,
                        "hostname": hostname,
                        "mixed_on_https": http_on_https,
                        "error_count": error_count,
                        "doc_csp_upgrade": doc_csp_upgrade,
                    },
                    {}
                )

                pages_out.append({
                    "url": final_url,
                    "title": title,
                    "htmlHash": html_hash,
                    "screenshotPath": screenshot_rel,
                    "structuredInfo": {"headings": headings, "links": links, "forms": forms},
                    "flags": flags,
                    "riskScore": page_risk,
                    "riskLevel": _risk_level(page_risk),
                    "riskReasons": reasons,
                    "networkSummary": page_network_summary,
                 })

                if depth < max_depth and len(pages_out) < max_pages and not dedup:
                    for link in links:
                        if len(pages_out) + len(frontier) >= max_pages: break
                        if (urlparse(link).scheme in ALLOWED_SCHEMES
                            and _same_origin(origin, link)
                            and link not in visited_urls):
                            if not obey_robots or _allowed_by_robots(rp, user_agent, link):
                                frontier.append((link, depth + 1))

                if delay_seconds > 0:
                    page.wait_for_timeout(int(delay_seconds * 1000))
        finally:
            try: context.close()
            except Exception: pass
            browser.close()

    pages_flagged = [
        p["url"] for p in pages_out
        if p["riskScore"] >= 40 or p["flags"].get("malwareDetected", False)
    ]

    if pages_out:
        scores = sorted((p["riskScore"] for p in pages_out), reverse=True)
        site_max = scores[0]
        top3_mean = mean(scores[:min(3, len(scores))])
        decile_idx = max(0, int(len(scores) * 0.1) - 1)
        pct90 = scores[decile_idx] if scores else 5
        site_risk_score = int(max(site_max, top3_mean, pct90))
        site_risk_level = _risk_level(site_risk_score)
    else:
        site_risk_score, site_risk_level = 5, "Low"


    def _safe_dt(s):
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None
        except Exception:
            return None

    scan_start = None
    scan_end = None
    req_total = resp_total = err_total = http_attempts_total = 0

    for p in pages_out:
        ns = p.get("networkSummary") or {}
        st = _safe_dt(ns.get("startTime"))
        en = _safe_dt(ns.get("endTime"))
        if st and (scan_start is None or st < scan_start): scan_start = st
        if en and (scan_end is None or en > scan_end): scan_end = en
        req_total += int(ns.get("requests") or 0)
        resp_total += int(ns.get("responses") or 0)
        err_total += int(ns.get("errors") or 0)
        http_attempts_total += int(ns.get("httpOnHttpsAttempts") or 0)

    scan_duration_ms = (int((scan_end - scan_start).total_seconds() * 1000)
                        if scan_start and scan_end else None)


    all_requests_sample = _dedupe_requests_log(all_requests_sample[:REQUESTS_SAMPLE_LIMIT])
    scraping_info = {
        "scan": {
            "startUrl": start_url,
            "submittedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "userAgent": user_agent,
            "maxPages": max_pages,
            "maxDepth": max_depth,
            "delaySeconds": delay_seconds,
            "obeyRobots": obey_robots,
        },
        "summary": {
            "pagesCrawled": len(pages_out),
            "pagesFlagged": len(pages_flagged),
            "requestsSampled": len(all_requests_sample),
            "siteRiskScore": site_risk_score,
            "siteRiskLevel": site_risk_level,
            "startTime": scan_start.isoformat().replace("+00:00", "Z") if scan_start else None,
            "endTime": scan_end.isoformat().replace("+00:00", "Z") if scan_end else None,
            "durationMs": scan_duration_ms,
            "requestsTotal": req_total,
            "responsesTotal": resp_total,
            "errorsTotal": err_total,
            "httpOnHttpsAttemptsTotal": http_attempts_total,
        },
        "network": {"requests": all_requests_sample[:REQUESTS_SAMPLE_LIMIT]},
        "pages": pages_out,
        "screenshots": screenshots_all,
    }

    abuse_flags = {
        "pagesFlagged": pages_flagged,
        "redirectChains": global_redirects,
        "globalSuspicion": {
            "anyObfuscation": any(p["flags"]["obfuscatedScripts"] for p in pages_out),
            "anyMetaRefresh": any(p["flags"]["usesMetaRefresh"] for p in pages_out),
            "totalSuspiciousJS": sum(len(p["flags"]["suspiciousJS"]) for p in pages_out),
            "totalKeywordMatches": sum(p["flags"]["keywordMatches"] for p in pages_out),
        },
    }

    logger.info(f"[Crawl Complete] crawled={len(pages_out)} flagged={len(pages_flagged)} start={start_url}")
    return scraping_info, abuse_flags
