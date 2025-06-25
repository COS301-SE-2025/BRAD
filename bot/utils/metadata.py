import socket
import ssl
import whois
import tldextract
import dns.resolver
from datetime import datetime

def gather_forensics(domain: str) -> dict:
    # Clean domain
    domain = domain.replace("http://", "").replace("https://", "").split("//")[0]
    ext = tldextract.extract(domain)
    full_domain = f"{ext.domain}.{ext.suffix}"

    # 1. IP Lookup
    try:
        ip = socket.gethostbyname(full_domain)
    except Exception as e:
        print(f"[BOT] IP lookup failed: {e}")
        ip = "Unavailable"

    # 2. WHOIS Lookup
    try:
        w = whois.whois(full_domain)
        #print(w)
        registrar = w.registrar or "Unavailable"
        whois_owner = w.org or w.name or "Unknown"
    except Exception as e:
        print(f"[BOT] WHOIS lookup failed: {e}")
        registrar = "Unavailable"
        whois_owner = "Unknown"

    # 3. SSL Certificate
    ssl_data = get_ssl_info(full_domain)

    # 4. DNS Records
    dns_data = get_dns_records(full_domain)

    # 5. Reverse IP Lookup
    try:
        reverse = socket.gethostbyaddr(ip)  # ➝ Reverse IP
        reverse_domain = reverse[0]
    except socket.herror:
        reverse_domain = "Unknown"

    return {
        "ip": ip,
        "reverseIp": reverse_domain,
        "registrar": registrar,
        "whoisOwner": whois_owner,
        "whoisRaw": w,
        "sslValid": ssl_data["valid"],
        "sslExpires": ssl_data["expires"],
        "dns": dns_data
    }

def get_ssl_info(domain: str) -> dict:
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
            s.settimeout(3)
            s.connect((domain, 443))
            cert = s.getpeercert()
            expires_raw = cert.get("notAfter", "Unknown")
            # Convert expiry to ISO format
            expires = (
                datetime.strptime(expires_raw, "%b %d %H:%M:%S %Y %Z").isoformat()
                if expires_raw != "Unknown" else "Unknown"
            )
            return {"valid": True, "expires": expires}
    except Exception as e:
        print(f"[!] SSL check failed: {e}")
        return {"valid": False, "expires": "Unknown"}
    
def get_dns_records(domain: str) -> dict:
    record_types = ['MX', 'NS', 'TXT']
    records = {}

    for record_type in record_types:
        try:
            answers = dns.resolver.resolve(domain, record_type)
            records[record_type] = [str(r.to_text()) for r in answers]
        except Exception as e:
            records[record_type] = [f"Unavailable: {e.__class__.__name__}"]

    return records
