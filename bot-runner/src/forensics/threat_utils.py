import os, requests
from ..utils.logger import get_logger 
IPINFO_TOKEN = os.getenv("IPINFO_TOKEN")

logger = get_logger(__name__)

def get_geo_info(ip: str) -> dict:
    if ip == "Unavailable":
        logger.warning("[Geo] Skipping geo lookup — IP is unavailable.")
        return {}

    try:
        url = f"https://ipinfo.io/{ip}/json"
        headers = {}
        params = {"token": IPINFO_TOKEN} if IPINFO_TOKEN else {}
        res = requests.get(url, timeout=3, headers=headers, params=params)
        data = res.json()
        return {
            "asn": data.get("org", ""),
            "country": data.get("country", "Unknown"),
            "region": data.get("region", ""),
            "city": data.get("city", ""),
        }
    except Exception as e:
        logger.error(f"[Geo] ipinfo failed for {ip}: {e}", exc_info=True)
        # lightweight fallback
        try:
            r = requests.get(f"https://ipapi.co/{ip}/json", timeout=3)
            d = r.json()
            return {
                "asn": d.get("asn", ""),
                "country": d.get("country", "Unknown"),
                "region": d.get("region", ""),
                "city": d.get("city", ""),
            }
        except Exception:
            return {}
