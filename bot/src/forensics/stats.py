# src/forensics/stats.py
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional

from ..utils.logger import get_logger
logger = get_logger(__name__)

# ---------- helpers ----------
def _to_aware_utc(v: Any) -> Optional[datetime]:
    """Coerce various date representations to timezone-aware UTC; return None if unparsable."""
    if v is None:
        return None
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc) if v.tzinfo else v.replace(tzinfo=timezone.utc)
    if isinstance(v, (int, float)):  # epoch seconds
        try:
            return datetime.fromtimestamp(v, tz=timezone.utc)
        except Exception:
            return None
    if isinstance(v, str):
        s = v.strip()
        # tolerate ISO with Z, with offset, or date-only
        try:
            if s.endswith("Z"):
                return datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc)
            dt = datetime.fromisoformat(s)
            return dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            # loose fallback: YYYY-MM-DD
            try:
                dt = datetime.strptime(s, "%Y-%m-%d")
                return dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
    return None

def _ensure_list(v: Any) -> list:
    if v is None:
        return []
    if isinstance(v, (list, tuple, set)):
        return list(v)
    return [v]

def _min_utc(values: Iterable[Any]) -> Optional[datetime]:
    norm = [d for d in (_to_aware_utc(x) for x in values) if d is not None]
    return min(norm) if norm else None

# ---------- main ----------
def calculate_stats(forensics: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("[Stats] Calculating statistics from forensic data...")
    stats: Dict[str, Any] = {}
    now_utc = datetime.now(timezone.utc)

    # WHOIS creation date → domain age (days)
    whois_raw = (forensics or {}).get("whoisRaw", {}) or {}
    created_vals = _ensure_list(whois_raw.get("creation_date"))
    created_at = _min_utc(created_vals)

    if created_at:
        stats["domain_age_days"] = (now_utc - created_at).days
        stats["domain_created"] = created_at.date().isoformat()
        logger.debug(f"[Stats] Domain creation date: {created_at.isoformat()} "
                     f"→ {stats['domain_age_days']} days old")
    else:
        stats["domain_age_days"] = -1
        stats["domain_created"] = "Unknown"
        logger.warning("[Stats] Domain creation date unavailable — cannot calculate domain age.")

    # SSL expiry (ISO string with Z/offset or datetime)
    ssl_expiry = forensics.get("sslExpires")
    ssl_dt: Optional[datetime] = _to_aware_utc(ssl_expiry) if ssl_expiry else None
    if ssl_dt:
        stats["ssl_days_remaining"] = (ssl_dt - now_utc).days
        logger.debug(f"[Stats] SSL expiry date: {ssl_dt.isoformat()} "
                     f"→ {stats['ssl_days_remaining']} days remaining")
    else:
        stats["ssl_days_remaining"] = -1
        logger.warning("[Stats] SSL expiry information unavailable or unparsable.")

    # DNS info
    dns_info = (forensics.get("dns") or {})
    txt_records = dns_info.get("TXT", []) or []
    stats["dns"] = {
        "mx_count": len(dns_info.get("MX", []) or []),
        "ns_count": len(dns_info.get("NS", []) or []),
        "has_spf": any(isinstance(t, str) and "v=spf1" in t.lower() for t in txt_records),
        "has_dmarc": any(isinstance(t, str) and "v=dmarc1" in t.lower() for t in txt_records),
    }
    logger.debug(f"[Stats] DNS stats: {stats['dns']}")
    logger.info("[Stats] Statistics calculation complete.")
    return stats
