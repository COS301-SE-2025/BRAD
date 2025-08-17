from __future__ import annotations
import json, socket, ssl
from datetime import datetime, timezone
from typing import Dict, Any, List, Set
from urllib.parse import urlparse
import tldextract

from ..utils.logger import get_logger
from .scraper import perform_crawl

logger = get_logger(__name__)

# ---------------------------- Network helpers ----------------------------
def _resolve_ips(host: str) -> List[str]:
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
        return sorted({i[4][0] for i in infos if i and i[4]})
    except Exception as e:
        logger.info(f"IP resolution failed for {host}: {e}")
        return []

def _fetch_tls_cert(host: str):
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=5.0) as sock:
            with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                cert = ssock.getpeercert()
                return {
                    "issuer": dict(x[0] for x in cert.get("issuer", [])),
                    "subject": dict(x[0] for x in cert.get("subject", [])),
                    "notBefore": cert.get("notBefore"),
                    "notAfter": cert.get("notAfter"),
                }
    except Exception:
        return {}

def _registrable_domain(url_or_host: str) -> str:
    host = urlparse(url_or_host).hostname or url_or_host
    e = tldextract.extract(host or "")
    if not e.domain or not e.suffix:
        return host or ""
    return f"{e.domain}.{e.suffix}"

# ---------------------------- AI Risk ----------------------------
def ai_risk_score(abuse_flags: Dict[str, Any], scraping_info: Dict[str, Any]) -> Dict[str, Any]:
    pages_flags = abuse_flags.get("pages", [])
    susp_js = sum(len(p.get("suspiciousJS", [])) for p in pages_flags)
    inline = sum(len(p.get("suspiciousInlineEvents", [])) for p in pages_flags)
    obf = any(p.get("obfuscatedScripts") for p in pages_flags)
    redirects = sum(max(len(p.get("redirectChain", [])) - 1, 0) for p in pages_flags)

    breakdown = {
        "obfuscatedScripts": 20 if obf else 0,
        "suspiciousJS": min(susp_js * 5, 25),
        "suspiciousInlineEvents": min(inline * 2, 10),
        "redirectHops": min(redirects * 5, 20),
        "keywordMatches": 0,           # plug in later if you add it
        "similarityScore>0.8": 0,      # plug in later if you add it
    }
    raw = sum(breakdown.values())
    score = max(10, min(100, raw))
    level = "Low" if score < 40 else "Medium" if score < 70 else "High"
    return {"score": score, "level": level, "breakdown": breakdown}

def _guidance(risk: Dict[str, Any], abuse_flags: Dict[str, Any], scraping_info: Dict[str, Any]) -> List[str]:
    tips: List[str] = []
    pf = abuse_flags.get("pages", [])
    if any(p.get("suspiciousJS") for p in pf):
        tips.append("Review suspicious JavaScript snippets (credential harvesters, loaders).")
    if any(p.get("obfuscatedScripts") for p in pf):
        tips.append("Detected obfuscation—beautify and analyze scripts before deciding.")
    if any((p.get("redirectChain") or []) for p in pf):
        tips.append("Follow redirect chain and vet external destinations in threat intel.")
    if any(scr.get("structuredInfo", {}).get("forms") for scr in scraping_info.get("pages", [])):
        tips.append("Verify forms do not post credentials to unknown origins.")
    if risk["level"] == "High":
        tips.append("If multiple indicators align (forms + obfuscated JS + redirects), classify as Malicious.")
    else:
        tips.append("If indicators appear benign (fonts/CDNs only), consider Benign with notes.")
    # dedupe
    out, seen = [], set()
    for t in tips:
        if t not in seen:
            seen.add(t); out.append(t)
    return out

# ---------------------------- Tech fingerprint (very light) ----------------------------
TECH_SIGS = {
    "fonts.googleapis.com": "Google Font API",
    "fonts.gstatic.com": "Google Font API",
    "ajax.googleapis.com": "Google Hosted Libraries",
    "cdn.jsdelivr.net": "jsDelivr CDN",
    "cdnjs.cloudflare.com": "Cloudflare CDN",
    "www.google-analytics.com": "Google Analytics",
}

def _detect_tech(hosts: Set[str]) -> List[str]:
    out = set()
    for h in hosts:
        for sig, label in TECH_SIGS.items():
            if h and h.endswith(sig):
                out.add(label)
    return sorted(out)

# ---------------------------- Main builder ----------------------------
def build_brad_report(
    domain: str,
    report_id: str,
    include_subdomains: bool = False,
    max_pages: int = 12,
    max_depth: int = 3,
    proxy_getter = None,
) -> Dict[str, Any]:
    url = domain if domain.startswith(("http://", "https://")) else f"https://{domain}"
    host = urlparse(url).hostname or domain
    scan_ts = datetime.now(timezone.utc).isoformat()

    # Crawl
    scraping_info, abuse_flags = perform_crawl(
        url,
        report_id=report_id,
        max_pages=max_pages,
        max_depth=max_depth,
        include_subdomains=include_subdomains,
        proxy_getter=proxy_getter,
    )

    pages = scraping_info.get("pages", [])
    visited_hosts = {urlparse(p.get("url","")).hostname for p in pages if p.get("url")}
    visited_hosts = {h for h in visited_hosts if h}
    root = _registrable_domain(host)

    # external hosts (from simple link/redirect skim)
    redirect_hosts = set()
    for p in abuse_flags.get("pages", []):
        for u in (p.get("redirectChain") or []):
            h = urlparse(u).hostname
            if h: redirect_hosts.add(h)

    link_hosts = set()
    for s in pages:
        for u in s.get("structuredInfo", {}).get("links", []):
            h = urlparse(u).hostname
            if h: link_hosts.add(h)

    external_hosts = {h for h in (redirect_hosts | link_hosts) if _registrable_domain(h) != root}

    # Network/TLS
    ips = _resolve_ips(host)
    tls = _fetch_tls_cert(host)

    # Risk + Guidance
    risk = ai_risk_score(abuse_flags, scraping_info)
    guidance = _guidance(risk, abuse_flags, scraping_info)

    # Tech
    tech = _detect_tech(visited_hosts | external_hosts)

    # Build urlscan-like document
    report = {
        "meta": {
            "domain": root,
            "hostname_scanned": host,
            "scanTime": scan_ts,
            "reportId": report_id,
            "bot": "BRAD (Crawler+AI)",
        },
        "summary": {
            "text": f"Crawled {len(pages)} page(s) across {len(visited_hosts)} host(s); "
                    f"subdomains={'on' if include_subdomains else 'off'}.",
            "keyFindings": _key_findings(abuse_flags),
            "aiRiskScore": risk["score"],
            "aiRiskLevel": risk["level"],
            "preliminaryVerdict": (
                "Likely Malicious" if risk["level"] == "High"
                else "Needs Review" if risk["level"] == "Medium"
                else "Likely Benign"
            ),
        },
        "liveInformation": {
            "dns": {"A": ips},
            "tls": tls,
            "safeBrowsing": "Unknown",
        },
        "crawlingReport": {
            "startUrl": scraping_info.get("startUrl"),
            "pagesCrawled": len(pages),
            "hostsVisited": sorted(visited_hosts),
            "externalDomainsReferenced": sorted(external_hosts),
            "pages": pages,  # lightweight per-page summaries with screenshots
        },
        "abuseIndicators": {
            "pages": abuse_flags.get("pages", []),
            "robots": abuse_flags.get("robots", {}),
        },
        "detectedTechnologies": tech,
        "aiRisk": risk,
        "investigatorGuidance": guidance,
    }
    return report

def _key_findings(abuse_flags: Dict[str, Any]) -> List[str]:
    pf = abuse_flags.get("pages", [])
    has_obf = any(p.get("obfuscatedScripts") for p in pf)
    sj = sum(len(p.get("suspiciousJS", [])) for p in pf)
    mr = any(p.get("usesMetaRefresh") for p in pf)
    rhops = sum(max(len(p.get("redirectChain", [])) - 1, 0) for p in pf)
    items = []
    if has_obf: items.append("Obfuscated JavaScript detected")
    if sj: items.append(f"{sj} suspicious JS snippet(s)")
    if mr: items.append("Meta refresh redirect present")
    if rhops: items.append(f"{rhops} redirect hop(s) observed")
    return items

def build_brad_report_json(*args, **kwargs) -> str:
    return json.dumps(build_brad_report(*args, **kwargs), indent=2, ensure_ascii=False)
