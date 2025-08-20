from datetime import datetime, timezone
from dateutil import parser
from typing import Dict, Any, Optional
from ..utils.logger import get_logger

logger = get_logger(__name__)

def compute_domain_age_days(whois_raw) -> Optional[int]:
    try:
        cd = whois_raw.get("creation_date")
        if isinstance(cd, list):
            cd = cd[0]
        if not cd:
            return None
        created = parser.parse(cd)
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        else:
            created = created.astimezone(timezone.utc)
        days = (datetime.now(timezone.utc) - created).days
        return days if days >= 0 else None
    except Exception:
        return None

def calculate_stats(forensics: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("[Stats] Calculating statistics from forensic data...")
    stats: Dict[str, Any] = {}

    # --- Domain age ---
    whois_raw = forensics.get("whoisRaw", {}) or {}
    age_days = compute_domain_age_days(whois_raw)
    stats["domain_age_days"] = age_days

    # Also try to surface a normalized created date (if parseable)
    domain_created: Optional[str] = None
    try:
        cd = whois_raw.get("creation_date")
        if isinstance(cd, list):
            cd = cd[0]
        if cd:
            created_dt = parser.parse(cd)
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            else:
                created_dt = created_dt.astimezone(timezone.utc)
            domain_created = created_dt.date().isoformat()
    except Exception:
        pass
    stats["domain_created"] = domain_created

    if age_days is not None:
        logger.debug(f"[Stats] Domain age: {age_days} days (created={domain_created})")
    else:
        logger.info("[Stats] Domain creation date unavailable — domain age not computed.")

    # --- SSL expiry ---
    ssl_raw = forensics.get("sslExpires")
    ssl_days_remaining: Optional[int] = None
    if ssl_raw and ssl_raw != "Unknown":
        try:
            exp = parser.parse(ssl_raw)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            else:
                exp = exp.astimezone(timezone.utc)
            ssl_days_remaining = (exp - datetime.now(timezone.utc)).days
        except Exception as e:
            logger.error(f"[Stats] Failed to parse SSL expiry ({ssl_raw}): {e}")
    else:
        logger.info("[Stats] SSL expiry information unavailable.")
    stats["ssl_days_remaining"] = ssl_days_remaining

    # --- DNS info ---
    dns_info = forensics.get("dns", {}) or {}
    txt_records = [t for t in (dns_info.get("TXT") or []) if isinstance(t, str)]
    dmarc_records = [t for t in (dns_info.get("DMARC") or []) if isinstance(t, str)]

    mx_count = len(dns_info.get("MX", []) or [])
    ns_count = len(dns_info.get("NS", []) or [])

    # SPF detection (root TXT)
    has_spf = any("v=spf1" in t.lower() for t in txt_records)

    # DMARC detection – from explicit DMARC list if present; otherwise look for DMARC TXT patterns
    has_dmarc = any("v=dmarc1" in t.lower() for t in dmarc_records) or \
                any("v=dmarc1" in t.lower() for t in txt_records)

    # If there’s no MX, mark SPF/DMARC as N/A so the scorer can skip penalties
    spf_effective = has_spf if mx_count > 0 else None
    dmarc_effective = has_dmarc if mx_count > 0 else None

    dmarc_records = dns_info.get("DMARC", [])
    stats["dns"] = {
        "mx_count": len(dns_info.get("MX", [])),
        "ns_count": len(dns_info.get("NS", [])),
        "has_spf": any("v=spf1" in (txt or "").lower() for txt in txt_records),
        "has_dmarc": any("v=dmarc1" in (txt or "").lower() for txt in dmarc_records),
    }

    logger.debug(f"[Stats] DNS stats: {stats['dns']}")
    logger.info("[Stats] Statistics calculation complete.")
    return stats
