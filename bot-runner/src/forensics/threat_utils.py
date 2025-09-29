# bot-runner/src/forensics/threat_utils.py
import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from ..utils.logger import get_logger
from ..utils.proxy import requests_proxies  

IPINFO_TOKEN = os.getenv("IPINFO_TOKEN")
GEO_TIMEOUT = float(os.getenv("GEO_TIMEOUT", "4.0"))  # seconds

logger = get_logger(__name__)

# ---- Shared session (proxy + retries) ----
_PROXIES = requests_proxies()  # {'http': 'http://user:pass@host:3128', 'https': ...} or None
_SESSION = requests.Session()
if _PROXIES:
    _SESSION.proxies.update(_PROXIES)

# conservative retry for transient proxy/network hiccups
_retry = Retry(
    total=2,
    connect=2,
    read=2,
    backoff_factor=0.4,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
    raise_on_status=False,
)
_SESSION.mount("https://", HTTPAdapter(max_retries=_retry))
_SESSION.mount("http://", HTTPAdapter(max_retries=_retry))

_HEADERS = {
    "User-Agent": "BRADBot/1.0 (+https://example.invalid/bot)",
    "Accept": "application/json",
}

def _ipinfo(ip: str) -> dict:
    url = f"https://ipinfo.io/{ip}/json"
    params = {"token": IPINFO_TOKEN} if IPINFO_TOKEN else None
    r = _SESSION.get(url, headers=_HEADERS, params=params, timeout=GEO_TIMEOUT)
    r.raise_for_status()
    data = r.json()
    return {
        "asn": data.get("org", "") or "",
        "country": data.get("country", "Unknown") or "Unknown",
        "region": data.get("region", "") or "",
        "city": data.get("city", "") or "",
    }

def _ipapi(ip: str) -> dict:
    url = f"https://ipapi.co/{ip}/json"
    r = _SESSION.get(url, headers=_HEADERS, timeout=GEO_TIMEOUT)
    r.raise_for_status()
    d = r.json()
    # ipapi uses different field names; map best-effort
    return {
        "asn": d.get("asn", "") or d.get("org", "") or "",
        "country": d.get("country", "Unknown") or "Unknown",
        "region": d.get("region", "") or d.get("region_code", "") or "",
        "city": d.get("city", "") or "",
    }

def get_geo_info(ip: str) -> dict:
    if not ip or ip == "Unavailable":
        logger.warning("[Geo] Skipping geo lookup — IP is unavailable.")
        return {}
    try:
        return _ipinfo(ip)
    except Exception as e:
        logger.warning(f"[Geo] ipinfo failed for {ip}: {e}. Falling back to ipapi...")
        try:
            return _ipapi(ip)
        except Exception as e2:
            logger.error(f"[Geo] ipapi failed for {ip}: {e2}", exc_info=True)
            return {}
