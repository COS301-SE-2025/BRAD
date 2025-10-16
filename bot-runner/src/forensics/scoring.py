from typing import Dict, Any, Tuple
from ..utils.logger import get_logger

logger = get_logger(__name__)

RISK_THRESHOLDS = {"low": 0, "medium": 4, "high": 7}

# Trim super-common infra to avoid constant false positives.
SUSPICIOUS_HOST_KEYWORDS = ['contabo', 'ovh']  # intentionally excludes aws/cloudflare/azure/google
THREAT_DOMAINS = ['malware-example.com', 'phishing-site.net']
THREAT_IPS = ['123.123.123.123', '66.66.66.66']
RISKY_COUNTRIES = ['RU', 'CN', 'KP', 'IR']

# Known safe/training domains that should slightly deflate the score.
ALLOWLIST_DOMAINS = {'books.toscrape.com', 'toscrape.com', 'example.com'}

def calculate_risk_score_with_reasons(stats: Dict[str, Any], forensics: Dict[str, Any]) -> Tuple[float, Dict[str, str]]:
    logger.info("[Scoring] Calculating risk score with reasons...")
    reasons: Dict[str, str] = {}
    score = 0.0

    domain = (forensics.get("domain") or "").strip().lower()
    ip = (forensics.get("ip") or "").strip()

    # 1) Domain age
    raw_age = stats.get("domain_age_days")
    domain_age = raw_age if isinstance(raw_age, (int, float)) and raw_age >= 0 else None
    if domain_age is None:
        reasons["new_domain"] = "Domain age unknown — not penalizing"
    elif domain_age < 30:
        reasons["new_domain"] = f"Domain is {int(domain_age)} days old (< 30)"
        score += 0.3
    else:
        reasons["new_domain"] = f"Domain is mature ({int(domain_age)} days)"

    # 2) SSL health
    ssl_remaining = stats.get("ssl_days_remaining", -1)
    if ssl_remaining <= 0:
        reasons["ssl_expired"] = f"SSL expired or invalid ({ssl_remaining} days)"
        score += 0.2
        logger.debug("[Scoring] SSL expired → +0.2")
    elif ssl_remaining <= 14:
        reasons["ssl_expired"] = f"SSL expiring soon ({ssl_remaining} days)"
        score += 0.05
        logger.debug("[Scoring] SSL expiring soon → +0.05")
    else:
        reasons["ssl_expired"] = f"SSL valid ({ssl_remaining} days remaining)"

    # 3) DNS posture
    dns = stats.get("dns", {}) or {}
    mx_count = int(dns.get("mx_count", 0) or 0)
    ns_count = int(dns.get("ns_count", 0) or 0)
    has_spf = bool(dns.get("has_spf", False))
    has_dmarc = bool(dns.get("has_dmarc", False))

    if mx_count > 0:
        if not has_spf:
            reasons["spf_missing"] = "SPF record is missing"
            score += 0.10
            logger.debug("[Scoring] SPF missing (+MX) → +0.10")
        else:
            reasons["spf_missing"] = "SPF record found"

        if not has_dmarc:
            reasons["dmarc_missing"] = "DMARC record is missing"
            score += 0.10
            logger.debug("[Scoring] DMARC missing (+MX) → +0.10")
        else:
            reasons["dmarc_missing"] = "DMARC record found"
    else:
        reasons["spf_missing"] = "No MX — not penalizing SPF"
        reasons["dmarc_missing"] = "No MX — not penalizing DMARC"

    # NS health: penalize too few; very high can be odd.
    if ns_count < 2:
        reasons["ns_health"] = f"{ns_count} NS record(s) — single point of failure"
        score += 0.10
        logger.debug(f"[Scoring] Low NS count ({ns_count}) → +0.10")
    elif ns_count > 8:
        reasons["ns_health"] = f"{ns_count} NS records — unusually high"
        score += 0.05
        logger.debug(f"[Scoring] High NS count ({ns_count}) → +0.05")
    else:
        reasons["ns_health"] = f"{ns_count} NS record(s) (normal)"

    # 4) Reverse IP hostname heuristics (gated to reduce noise)
    raw = forensics.get("reverseIp")
    rev = (raw or "").strip()         # original case
    rev_l = rev.lower()
    if rev_l in {"", "unknown", "n/a", "none"}:
        reasons["reverse_ip_suspicious"] = "Reverse DNS unavailable — no penalty"
        logger.debug("[Scoring] Reverse DNS unavailable; no penalty applied")
    else:
        if any(k in rev_l for k in SUSPICIOUS_HOST_KEYWORDS):
            reasons["reverse_ip_suspicious"] = f"Reverse DNS hostname ({rev}) contains suspicious keywords"
            score += 0.1
            logger.debug(f"[Scoring] Reverse DNS suspicious ({rev}) → +0.1")
        else:
            reasons["reverse_ip_suspicious"] = f"Reverse DNS ({rev}) is clean"
            logger.debug(f"[Scoring] Reverse DNS clean ({rev})")

    # 5) Threat intel hits (heavy signals)
    if domain in THREAT_DOMAINS:
        reasons["threat_domain_match"] = "Domain found in known threat list"
        score += 0.5
        # replace lines with " → +0.5" to use ASCII:
        logger.warning(f"[Scoring] Threat domain match: {domain} -> +0.5")
        logger.warning(f"[Scoring] Threat IP match: {ip} -> +0.5")
    if ip in THREAT_IPS:
        reasons["threat_ip_match"] = "IP found in known threat list"
        score += 0.5
        logger.warning(f"[Scoring] Threat IP match: {ip} → +0.5")

    # 6) Geo risk (gated)
    country = (forensics.get("geo", {}) or {}).get("country")
    if country in RISKY_COUNTRIES and ((domain_age is not None and domain_age < 90) or ssl_remaining <= 0):
        reasons["geo_risk"] = f"Hosted in higher-risk country: {country}"
        score += 0.10
        logger.warning(f"[Scoring] Geo risk {country} (+gate) → +0.10")
    else:
        reasons["geo_risk"] = f"Country {country or 'Unknown'} (OK)"

    # 7) Allowlist bias (training / sandbox domains) — apply ONCE, keep delta out of user-facing text
    if domain in ALLOWLIST_DOMAINS:
        prev = score
        score = max(0.0, score - 0.12)
        reasons["allowlist_bias"] = "Training/sandbox domain — slight forgiveness applied"
        logger.debug(f"[Scoring] Allowlist {domain}: {prev:.2f} → {score:.2f}")

    total_score = round(min(score * 10, 10.0), 2)
    logger.info(f"[Scoring] Final score: {total_score} ({risk_label(total_score)})")
    logger.debug(f"[Scoring] Reasons: {reasons}")
    return total_score, reasons

def risk_label(score: float) -> str:
    if score >= RISK_THRESHOLDS["high"]:
        return "High"
    elif score >= RISK_THRESHOLDS["medium"]:
        return "Medium"
    return "Low"
