import socket
import ssl
import whois
import tldextract
import dns.resolver
from datetime import datetime
from .logger import get_logger  

logger = get_logger(__name__)

def safe_whois_lookup(domain, timeout=5):
    try:
        logger.debug(f"[WHOIS] Performing WHOIS lookup for {domain} with timeout={timeout}s")
        socket.setdefaulttimeout(timeout)  # affects underlying socket
        result = whois.whois(domain)
        logger.debug(f"[WHOIS] Lookup result: {result}")
        return result
    except Exception as e:
        logger.error(f"[WHOIS] Lookup failed for {domain}: {e}", exc_info=True)
        return None

def gather_forensics(domain: str) -> dict:
    logger.info(f"[Forensics] Gathering forensic data for {domain}")

    # Clean domain
    domain = domain.replace("http://", "").replace("https://", "").split("//")[0]
    ext = tldextract.extract(domain)
    full_domain = f"{ext.domain}.{ext.suffix}"
    logger.debug(f"[Forensics] Normalized domain: {full_domain}")

    # 1. IP Lookup
    try:
        ip = socket.gethostbyname(full_domain)
        logger.debug(f"[Forensics] Resolved IP for {full_domain}: {ip}")
    except Exception as e:
        logger.error(f"[Forensics] IP lookup failed for {full_domain}: {e}")
        ip = "Unavailable"

    # 2. WHOIS Lookup
    try:
        w = whois.whois(full_domain)
        registrar = w.registrar or "Unavailable"
        whois_owner = w.org or w.name or "Unknown"
        whois_raw = dict(w)
        logger.debug(f"[Forensics] WHOIS registrar: {registrar}, owner: {whois_owner}")
    except Exception as e:
        logger.error(f"[Forensics] WHOIS lookup failed for {full_domain}: {e}")
        registrar = "Unavailable"
        whois_owner = "Unknown"
        whois_raw = {}

    # 3. SSL Certificate
    ssl_data = get_ssl_info(full_domain)

    # 4. DNS Records
    dns_data = get_dns_records(full_domain)

    # 5. Reverse IP Lookup
    try:
        reverse = socket.gethostbyaddr(ip)
        reverse_domain = reverse[0]
        logger.debug(f"[Forensics] Reverse IP lookup for {ip}: {reverse_domain}")
    except socket.herror:
        reverse_domain = "Unknown"
        logger.warning(f"[Forensics] Reverse IP lookup failed for {ip}")

    return {
        "ip": ip,
        "reverseIp": reverse_domain,
        "registrar": registrar,
        "whoisOwner": whois_owner,
        "whoisRaw": whois_raw,
        "sslValid": ssl_data["valid"],
        "sslExpires": ssl_data["expires"],
        "dns": dns_data
    }

def get_ssl_info(domain: str) -> dict:
    logger.debug(f"[SSL] Checking SSL certificate for {domain}")
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(3)
            s.connect((domain, 443))
            cert = s.getpeercert()
            expires_raw = cert.get("notAfter", "Unknown")
            expires = (
                datetime.strptime(expires_raw, "%b %d %H:%M:%S %Y %Z").isoformat()
                if expires_raw != "Unknown" else "Unknown"
            )
            logger.debug(f"[SSL] Certificate valid, expires on {expires}")
            return {"valid": True, "expires": expires}
    except Exception as e:
        logger.error(f"[SSL] Check failed for {domain}: {e}")
        return {"valid": False, "expires": "Unknown"}

def get_dns_records(domain: str) -> dict:
    logger.debug(f"[DNS] Fetching DNS records for {domain}")
    record_types = ['MX', 'NS', 'TXT']
    records = {}

    for record_type in record_types:
        try:
            answers = dns.resolver.resolve(domain, record_type)
            records[record_type] = [str(r.to_text()) for r in answers]
            logger.debug(f"[DNS] {record_type} records for {domain}: {records[record_type]}")
        except Exception as e:
            error_msg = f"Unavailable: {e.__class__.__name__}"
            records[record_type] = [error_msg]
            logger.warning(f"[DNS] Failed to fetch {record_type} for {domain}: {e}")

    return records
