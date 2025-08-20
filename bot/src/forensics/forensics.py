import socket
import ssl
import whois
import tldextract
import dns.resolver
from datetime import datetime
from typing import Dict, Any
from .threat_utils import get_geo_info
from urllib.parse import urlparse

def sanitize_domain(value: str) -> str:
    raw = (value or "").strip().lower().replace("\u200b","").replace("\u2060","")
    host = urlparse(raw).netloc or raw.split("/")[0]
    host = host.rstrip(".")
    try:
        # ensure punycode (IDN) is handled
        host = host.encode("idna").decode("ascii")
    except Exception:
        pass
    return host

def get_ip(domain: str) -> str:
    try:
        socket.setdefaulttimeout(3)
        infos = socket.getaddrinfo(domain, None)
        # prefer IPv4 first, else IPv6
        addrs = [ai[4][0] for ai in infos]
        v4 = [a for a in addrs if ":" not in a]
        return (v4 or addrs)[0]
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
        wr = dict(w)
        # normalize common datetime fields to isoformat if needed
        for k in ("creation_date", "updated_date", "expiration_date"):
            v = wr.get(k)
            if isinstance(v, list):
                wr[k] = [x.isoformat() if hasattr(x, "isoformat") else str(x) for x in v]
            elif hasattr(v, "isoformat"):
                wr[k] = v.isoformat()
        return {
            "registrar": w.registrar or "Unavailable",
            "whoisOwner": w.org or w.name or "Unknown",
            "creation_date": w.creation_date,
            "whoisRaw": wr
        }
    except Exception:
        return {"registrar": "Unavailable", "whoisOwner": "Unknown", "creation_date": None, "whoisRaw": {}}


def get_ssl_info(domain: str) -> Dict[str, Any]:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(3)
            s.connect((domain, 443))
            cert = s.getpeercert()
            not_after = cert.get("notAfter")
            expires = (
                datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                if not_after else None
            )
            # valid only if we have an expiry in the future
            now = datetime.utcnow()
            is_valid = bool(expires and expires > now)

            # pull extra details (issuer, subject, SANs)
            subject = dict(x[0] for x in cert.get("subject", []))
            issuer = dict(x[0] for x in cert.get("issuer", []))
            san = []
            for k, v in cert.get("subjectAltName", []):
                if k.lower() == "dns":
                    san.append(v)

            return {
                "valid": is_valid,
                "expires": expires,
                "issuer": issuer.get("organizationName") or issuer.get("commonName"),
                "subjectCN": subject.get("commonName"),
                "subjectAltNames": san,
            }
    except Exception:
        return {"valid": False, "expires": None, "issuer": None, "subjectCN": None, "subjectAltNames": []}

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

    # NEW: DMARC TXT at _dmarc.domain
    try:
        dmarc_name = f"_dmarc.{domain}"
        answers = resolver.resolve(dmarc_name, "TXT")
        records["DMARC"] = [str(r.to_text()) for r in answers]
    except Exception:
        records["DMARC"] = []

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
