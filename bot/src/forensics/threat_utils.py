import requests

def get_geo_info(ip: str) -> dict:
    if ip == "Unavailable":
        return {}
    try:
        res = requests.get(f"https://ipinfo.io/{ip}/json", timeout=3)
        data = res.json()
        return {
            "asn": data.get("org", ""),
            "country": data.get("country", "Unknown"),
            "region": data.get("region", ""),
            "city": data.get("city", ""),
        }
    except Exception:
        return {}
