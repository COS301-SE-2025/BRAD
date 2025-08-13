from typing import Dict, Any, Tuple

RISK_THRESHOLDS = {
    "low": 0,
    "medium": 4,
    "high": 7
}

SUSPICIOUS_HOST_KEYWORDS = ['aws', 'ovh', 'contabo', 'cloudflare', 'azure', 'google']
THREAT_DOMAINS = ['malware-example.com', 'phishing-site.net']
THREAT_IPS = ['123.123.123.123', '66.66.66.66']
RISKY_COUNTRIES = ['RU', 'CN', 'KP', 'IR']

def calculate_risk_score_with_reasons(stats: Dict[str, Any], forensics: Dict[str, Any]) -> Tuple[float, Dict[str, str]]:
    reasons = {}
    score = 0.0

    domain_age = stats.get("domain_age_days", 9999)
    if domain_age < 30:
        reasons["new_domain"] = f"Domain is {domain_age} days old (< 30)"
        score += 0.3
    else:
        reasons["new_domain"] = f"Domain is mature ({domain_age} days)"

    ssl_remaining = stats.get("ssl_days_remaining", -1)
    if ssl_remaining <= 0:
        reasons["ssl_expired"] = f"SSL expired or invalid ({ssl_remaining} days)"
        score += 0.2
    else:
        reasons["ssl_expired"] = f"SSL valid ({ssl_remaining} days remaining)"

    dns = stats.get("dns", {})
    if not dns.get("has_spf", False):
        reasons["spf_missing"] = "SPF record is missing"
        score += 0.15
    else:
        reasons["spf_missing"] = "SPF record found"

    if not dns.get("has_dmarc", False):
        reasons["dmarc_missing"] = "DMARC record is missing"
        score += 0.15
    else:
        reasons["dmarc_missing"] = "DMARC record found"

    ns_count = dns.get("ns_count", 0)
    if ns_count > 2:
        reasons["shared_hosting"] = f"{ns_count} NS records suggest shared hosting"
        score += 0.1
    else:
        reasons["shared_hosting"] = f"{ns_count} NS record(s) (OK)"

    reverse_ip = forensics.get("reverseIp", "").lower()
    if any(k in reverse_ip for k in SUSPICIOUS_HOST_KEYWORDS):
        reasons["reverse_ip_suspicious"] = f"Reverse IP hostname ({reverse_ip}) contains suspicious keywords"
        score += 0.1
    else:
        reasons["reverse_ip_suspicious"] = f"Reverse IP ({reverse_ip}) is clean"

    domain = forensics.get("domain", "")
    ip = forensics.get("ip", "")
    if domain in THREAT_DOMAINS:
        reasons["threat_domain_match"] = f"Domain found in known threat list"
        score += 0.5
    if ip in THREAT_IPS:
        reasons["threat_ip_match"] = f"IP found in known threat list"
        score += 0.5

    geo = forensics.get("geo", {})
    if geo.get("country") in RISKY_COUNTRIES:
        reasons["geo_risk"] = f"Domain hosted in risky country: {geo.get('country')}"
        score += 0.3
    else:
        reasons["geo_risk"] = f"Country {geo.get('country', 'Unknown')} (OK)"

    total_score = round(min(score * 10, 10.0), 2)
    return total_score, reasons

def risk_label(score: float) -> str:
    if score >= RISK_THRESHOLDS["high"]:
        return "High"
    elif score >= RISK_THRESHOLDS["medium"]:
        return "Medium"
    return "Low"
