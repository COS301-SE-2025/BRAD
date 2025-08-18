import requests
from ..utils.logger import get_logger 

logger = get_logger(__name__)

def get_geo_info(ip: str) -> dict:
    if ip == "Unavailable":
        logger.warning("[Geo] Skipping geo lookup — IP is unavailable.")
        return {}

    try:
        logger.debug(f"[Geo] Fetching geo info for IP: {ip}")
        res = requests.get(f"https://ipinfo.io/{ip}/json", timeout=3)
        data = res.json()

        geo_info = {
            "asn": data.get("org", ""),
            "country": data.get("country", "Unknown"),
            "region": data.get("region", ""),
            "city": data.get("city", ""),
        }

        logger.debug(f"[Geo] Geo info for {ip}: {geo_info}")
        return geo_info

    except Exception as e:
        logger.error(f"[Geo] Failed to fetch geo info for {ip}: {e}", exc_info=True)
        return {}
