from datetime import datetime
from typing import Dict, Any
from ..utils.logger import get_logger  

logger = get_logger(__name__)

def calculate_stats(forensics: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("[Stats] Calculating statistics from forensic data...")
    stats = {}

    # Domain age
    creation_date = forensics.get("whoisRaw", {}).get("creation_date")
    if isinstance(creation_date, list):
        creation_date = min(creation_date)

    if isinstance(creation_date, datetime):
        stats["domain_age_days"] = (datetime.now() - creation_date).days
        stats["domain_created"] = creation_date.strftime("%Y-%m-%d")
        logger.debug(f"[Stats] Domain creation date: {creation_date} → {stats['domain_age_days']} days old")
    else:
        stats["domain_age_days"] = -1
        stats["domain_created"] = "Unknown"
        logger.warning("[Stats] Domain creation date unavailable — cannot calculate domain age.")

    # SSL expiry
    ssl_expiry = forensics.get("sslExpires")
    if ssl_expiry and ssl_expiry != "Unknown":
        try:
            expiry_dt = datetime.fromisoformat(ssl_expiry)
            stats["ssl_days_remaining"] = (expiry_dt - datetime.now()).days
            logger.debug(f"[Stats] SSL expiry date: {ssl_expiry} → {stats['ssl_days_remaining']} days remaining")
        except Exception as e:
            stats["ssl_days_remaining"] = -1
            logger.error(f"[Stats] Failed to parse SSL expiry date ({ssl_expiry}): {e}")
    else:
        stats["ssl_days_remaining"] = -1
        logger.warning("[Stats] SSL expiry information unavailable.")

    # DNS info
    dns_info = forensics.get("dns", {})
    txt_records = dns_info.get("TXT", [])

    stats["dns"] = {
        "mx_count": len(dns_info.get("MX", [])),
        "ns_count": len(dns_info.get("NS", [])),
        "has_spf": any("v=spf1" in txt.lower() for txt in txt_records),
        "has_dmarc": any("v=dmarc1" in txt.lower() for txt in txt_records),
    }

    logger.debug(f"[Stats] DNS stats: {stats['dns']}")
    logger.info("[Stats] Statistics calculation complete.")

    return stats
