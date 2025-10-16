# tests/test_forensics.py
import types
import datetime
import pytest
import sys, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # bot-runner/
sys.path.insert(0, str(ROOT))


from src.forensics.forensics import (
    sanitize_domain,
    get_ip,
    get_reverse_ip,
    get_whois_info,
    get_ssl_info,
    get_dns_records,
    gather_forensics,
)

#
# sanitize_domain
#
@pytest.mark.parametrize("raw,expected", [
    ("example.com", "example.com"),
    ("EXAMPLE.com", "example.com"),
    ("https://example.com/path?x=1", "example.com"),
    ("example.com.", "example.com"),
    ("examp\u200Ble.\u2060com", "example.com"),   # zero-width chars stripped
    ("xn--exmple-cua.com", "xn--exmple-cua.com"), # punycode left as-is
])
def test_sanitize_domain_basic(raw, expected):
    assert sanitize_domain(raw) == expected


#
# get_ip
#
def test_get_ip_prefers_ipv4(monkeypatch):
    calls = []
    def fake_getaddrinfo(domain, _):
        calls.append(domain)
        # return both v6 and v4; code should pick IPv4 first
        return [
            (None, None, None, None, ("2001:db8::1", 0)),
            (None, None, None, None, ("93.184.216.34", 0)),
        ]
    monkeypatch.setattr("src.forensics.forensics.socket.getaddrinfo", fake_getaddrinfo)
    ip = get_ip("example.com")
    assert ip == "93.184.216.34"
    assert calls == ["example.com"]

def test_get_ip_unavailable_on_exception(monkeypatch):
    monkeypatch.setattr("src.forensics.forensics.socket.getaddrinfo", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("boom")))
    assert get_ip("example.com") == "Unavailable"


#
# get_reverse_ip
#
def test_get_reverse_ip_happy(monkeypatch):
    monkeypatch.setattr("src.forensics.forensics.socket.gethostbyaddr", lambda ip: ("example.com", [], []))
    assert get_reverse_ip("93.184.216.34") == "example.com"

def test_get_reverse_ip_unknown_on_exception(monkeypatch):
    monkeypatch.setattr("src.forensics.forensics.socket.gethostbyaddr", lambda ip: (_ for _ in ()).throw(OSError("no rdns")))
    assert get_reverse_ip("93.184.216.34") == "Unknown"

def test_get_reverse_ip_unknown_when_unavailable():
    assert get_reverse_ip("Unavailable") == "Unknown"


#
# get_whois_info
#
class DummyWhois:
    def __init__(self):
        self.registrar = "Example Registrar"
        self.org = None
        self.name = "John Doe"
        # creation_date as a list of datetimes to exercise normalization into whoisRaw
        self.creation_date = [
            datetime.datetime(2020, 1, 1, 12, 0, 0),
            datetime.datetime(2022, 2, 2, 12, 0, 0),
        ]
    def __iter__(self):
        # python-whois returns a dict-like; our code does dict(w)
        return iter({"registrar": self.registrar, "creation_date": self.creation_date}.items())

def test_get_whois_info_success(monkeypatch):
    import types
    import src.forensics.forensics as fmod

    class DummyWhois:
        def __init__(self):
            self.registrar = "Example Registrar"
            self.org = None
            self.name = "John Doe"
            self.creation_date = [datetime.datetime(2020, 1, 1, 12, 0, 0)]
        def __iter__(self):
            return iter({"registrar": self.registrar, "creation_date": self.creation_date}.items())

    # Replace the imported 'whois' module in forensics with a stub that has .whois()
    stub = types.SimpleNamespace(whois=lambda domain: DummyWhois())
    monkeypatch.setattr(fmod, "whois", stub, raising=False)

    info = get_whois_info("example.com")
    assert info["registrar"] == "Example Registrar"
    assert info["whoisOwner"] == "John Doe"
    assert isinstance(info["whoisRaw"]["creation_date"], list)


def test_get_whois_info_fail(monkeypatch):
    import types
    import src.forensics.forensics as fmod

    # Stub whose .whois() raises
    def _boom(domain): raise Exception("fail")
    stub = types.SimpleNamespace(whois=_boom)
    monkeypatch.setattr(fmod, "whois", stub, raising=False)

    info = get_whois_info("example.com")
    assert info["registrar"] == "Unavailable"
    assert info["whoisOwner"] == "Unknown"
    assert info["creation_date"] is None
    assert info["whoisRaw"] == {}


#
# get_ssl_info
#
class FakeSSLSocket:
    def __init__(self, cert):
        self._cert = cert
        self.timeout = None
    def settimeout(self, t): self.timeout = t
    def connect(self, addr): return None
    def getpeercert(self): return self._cert
    def __enter__(self): return self
    def __exit__(self, exc_type, exc, tb): return False

def test_get_ssl_info_parses_cert(monkeypatch):
    # A far-future expiry so valid=True
    not_after = "Dec 31 23:59:59 2099 GMT"
    cert = {
        "notAfter": not_after,
        "subject": ((("commonName", "example.com"),),),
        "issuer": ((("organizationName", "Let’s Encrypt"),),),
        "subjectAltName": (("DNS", "example.com"), ("DNS", "www.example.com")),
    }

    class FakeContext:
        def wrap_socket(self, sock, server_hostname=None):
            return FakeSSLSocket(cert)

    monkeypatch.setattr("src.forensics.forensics.ssl.create_default_context", lambda: FakeContext())
    info = get_ssl_info("example.com")
    assert info["valid"] is True
    assert info["issuer"] == "Let’s Encrypt"
    assert info["subjectCN"] == "example.com"
    assert set(info["subjectAltNames"]) == {"example.com", "www.example.com"}
    assert isinstance(info["expires"], datetime.datetime)

def test_get_ssl_info_on_error(monkeypatch):
    class BadContext:
        def wrap_socket(self, *a, **k):
            raise RuntimeError("no tls")
    monkeypatch.setattr("src.forensics.forensics.ssl.create_default_context", lambda: BadContext())
    info = get_ssl_info("example.com")
    assert info == {"valid": False, "expires": None, "issuer": None, "subjectCN": None, "subjectAltNames": []}


#
# get_dns_records
#
def test_get_dns_records_including_dmarc(monkeypatch):
    class FakeAnswer:
        def __init__(self, text): self._t = text
        def to_text(self): return self._t
    class FakeResolver:
        def __init__(self): self.timeout = 0; self.lifetime = 0
        def resolve(self, name, rtype):
            if rtype == "MX":
                return [FakeAnswer("10 mail.example.com.")]
            if rtype == "NS":
                return [FakeAnswer("ns1.example.com."), FakeAnswer("ns2.example.com.")]
            if rtype == "TXT" and name == "example.com":
                return [FakeAnswer('"v=spf1 -all"')]
            if rtype == "TXT" and name == "_dmarc.example.com":
                return [FakeAnswer('"v=DMARC1; p=reject"')]
            raise Exception("nope")
    monkeypatch.setattr("src.forensics.forensics.dns.resolver.Resolver", lambda: FakeResolver())
    recs = get_dns_records("example.com")
    assert "MX" in recs and recs["MX"] == ["10 mail.example.com."]
    assert "NS" in recs and len(recs["NS"]) == 2
    assert recs["TXT"] == ['"v=spf1 -all"']
    assert recs["DMARC"] == ['"v=DMARC1; p=reject"']

def test_get_dns_records_handles_timeouts(monkeypatch):
    class BadResolver:
        def __init__(self): self.timeout = 0; self.lifetime = 0
        def resolve(self, *a, **k): raise TimeoutError("slow")
    monkeypatch.setattr("src.forensics.forensics.dns.resolver.Resolver", lambda: BadResolver())
    recs = get_dns_records("example.com")
    # Should degrade to empty lists
    assert recs == {"MX": [], "NS": [], "TXT": [], "DMARC": []}


#
# gather_forensics
#
def test_gather_forensics_composes_everything(monkeypatch):
    # Stub all inner calls to keep this a pure unit test
    monkeypatch.setattr("src.forensics.forensics.tldextract.extract",
                        lambda d: types.SimpleNamespace(domain="example", suffix="com"))
    monkeypatch.setattr("src.forensics.forensics.get_ip", lambda d: "93.184.216.34")
    monkeypatch.setattr("src.forensics.forensics.get_reverse_ip", lambda ip: "example.com")
    monkeypatch.setattr("src.forensics.forensics.get_whois_info",
                        lambda d: {"registrar": "Reg", "whoisOwner": "Owner", "whoisRaw": {}, "creation_date": None})
    future = datetime.datetime(2099, 12, 31, 23, 59, 59)
    monkeypatch.setattr("src.forensics.forensics.get_ssl_info",
                        lambda d: {"valid": True, "expires": future, "issuer": "LE", "subjectCN": "example.com", "subjectAltNames": []})
    monkeypatch.setattr("src.forensics.forensics.get_dns_records",
                        lambda d: {"MX": [], "NS": [], "TXT": [], "DMARC": []})
    monkeypatch.setattr("src.forensics.forensics.get_geo_info",
                        lambda ip: {"asn": "AS15169", "country": "US", "region": "CA", "city": "Mountain View"})

    out = gather_forensics("https://Example.com/login")
    # Domain normalized
    assert out["domain"] == "example.com"
    # IP & reverse
    assert out["ip"] == "93.184.216.34"
    assert out["reverseIp"] == "example.com"
    # WHOIS
    assert out["registrar"] == "Reg"
    assert out["whoisOwner"] == "Owner"
    # SSL
    assert out["sslValid"] is True
    assert out["sslExpires"].startswith("2099-12-31T23:59:59")
    # DNS / Geo
    assert out["dns"]["DMARC"] == []
    assert out["geo"]["asn"] == "AS15169"
    # Timestamp exists
    assert "timestamp" in out and isinstance(out["timestamp"], str)
