import socket
import ssl
import whois
import tldextract
import dns.resolver
from datetime import datetime
from typing import Dict, Any
from .threat_utils import get_geo_info

def sanitize_domain(domain: str) -> str:
    return domain.replace("http://", "").replace("https://", "").split("/")[0].split("?")[0]

def get_ip(domain: str) -> str:
    try:
        socket.setdefaulttimeout(3)
        return socket.gethostbyname(domain)
    except Exception:
        return "Unavailable"

def get_reverse_ip(ip: str) -> str:
    if ip == "Unavailable":
        return "Unknown"
    try:
        socket.setdefaulttimeout(2)
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return "Unknown"

def get_whois_info(domain: str) -> Dict[str, Any]:
    try:
        socket.setdefaulttimeout(5)
        w = whois.whois(domain)
        return {
            "registrar": w.registrar or "Unavailable",
            "whoisOwner": w.org or w.name or "Unknown",
            "creation_date": w.creation_date,
            "whoisRaw": dict(w)
        }
    except Exception:
        return {
            "registrar": "Unavailable",
            "whoisOwner": "Unknown",
            "creation_date": None,
            "whoisRaw": {}
        }

def get_ssl_info(domain: str) -> Dict[str, Any]:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(3)
            s.connect((domain, 443))
            cert = s.getpeercert()
            expires_raw = cert.get("notAfter", "Unknown")
            expires = (
                datetime.strptime(expires_raw, "%b %d %H:%M:%S %Y %Z")
                if expires_raw != "Unknown" else None
            )
            return {"valid": True, "expires": expires}
    except Exception:
        return {"valid": False, "expires": None}

def get_dns_records(domain: str) -> Dict[str, Any]:
    records = {}
    resolver = dns.resolver.Resolver()
    resolver.timeout = 3
    resolver.lifetime = 3

    for record_type in ['MX', 'NS', 'TXT']:
        try:
            answers = resolver.resolve(domain, record_type)
            records[record_type] = [str(r.to_text()) for r in answers]
        except Exception:
            records[record_type] = []
    return records

def gather_forensics(domain: str) -> Dict[str, Any]:
    domain = sanitize_domain(domain)
    ext = tldextract.extract(domain)
    full_domain = f"{ext.domain}.{ext.suffix}" if ext.suffix else domain

    ip = get_ip(full_domain)
    reverse_ip = get_reverse_ip(ip)
    whois_info = get_whois_info(full_domain)
    ssl_info = get_ssl_info(full_domain)
    dns_info = get_dns_records(full_domain)
    geo_info = get_geo_info(ip)

    return {
        "domain": full_domain,
        "ip": ip,
        "reverseIp": reverse_ip,
        "registrar": whois_info["registrar"],
        "whoisOwner": whois_info["whoisOwner"],
        "whoisRaw": whois_info["whoisRaw"],
        "sslValid": ssl_info["valid"],
        "sslExpires": ssl_info["expires"].isoformat() if ssl_info["expires"] else "Unknown",
        "dns": dns_info,
        "geo": geo_info,
        "timestamp": datetime.now().isoformat()
    }
