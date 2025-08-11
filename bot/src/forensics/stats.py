from datetime import datetime
from typing import Dict, Any

def calculate_stats(forensics: Dict[str, Any]) -> Dict[str, Any]:
    stats = {}

    # Domain age
    creation_date = forensics.get("whoisRaw", {}).get("creation_date")
    if isinstance(creation_date, list):
        creation_date = min(creation_date)
    if isinstance(creation_date, datetime):
        stats["domain_age_days"] = (datetime.now() - creation_date).days
        stats["domain_created"] = creation_date.strftime("%Y-%m-%d")
    else:
        stats["domain_age_days"] = -1
        stats["domain_created"] = "Unknown"

    # SSL
    ssl_expiry = forensics.get("sslExpires")
    if ssl_expiry and ssl_expiry != "Unknown":
        try:
            expiry_dt = datetime.fromisoformat(ssl_expiry)
            stats["ssl_days_remaining"] = (expiry_dt - datetime.now()).days
        except Exception:
            stats["ssl_days_remaining"] = -1
    else:
        stats["ssl_days_remaining"] = -1

    # DNS
    dns_info = forensics.get("dns", {})
    txt_records = dns_info.get("TXT", [])

    stats["dns"] = {
        "mx_count": len(dns_info.get("MX", [])),
        "ns_count": len(dns_info.get("NS", [])),
        "has_spf": any("v=spf1" in txt.lower() for txt in txt_records),
        "has_dmarc": any("v=dmarc1" in txt.lower() for txt in txt_records),
    }

    return stats
