# tests/test_metadata.py
import datetime
import types
import pytest

import src.utils.metadata as M


# ---------------- safe_whois_lookup ----------------

def test_safe_whois_lookup_success(monkeypatch):
    class Dummy:
        def __repr__(self): return "<DummyWHOIS>"
    calls = {}

    def fake_settimeout(t):
        calls["timeout"] = t

    monkeypatch.setattr(M.socket, "setdefaulttimeout", fake_settimeout)
    # Replace the module's whois object with one that has a .whois() callable
    monkeypatch.setattr(M, "whois", types.SimpleNamespace(whois=lambda d: Dummy()))

    out = M.safe_whois_lookup("example.com", timeout=7)
    assert isinstance(out, Dummy)
    assert calls["timeout"] == 7


def test_safe_whois_lookup_failure_returns_none(monkeypatch):
    monkeypatch.setattr(M.socket, "setdefaulttimeout", lambda *a, **k: None)
    # Make .whois raise to exercise error branch
    monkeypatch.setattr(M, "whois", types.SimpleNamespace(
        whois=lambda d: (_ for _ in ()).throw(RuntimeError("boom"))
    ))
    assert M.safe_whois_lookup("example.com") is None


# ---------------- get_ssl_info ----------------

class _FakeSSLSocket:
    def __init__(self, cert):
        self._cert = cert
        self.timeout = None
        self.connected = False
    def settimeout(self, t): self.timeout = t
    def connect(self, addr): self.connected = True
    def getpeercert(self): return self._cert
    def __enter__(self): return self
    def __exit__(self, exc_type, exc, tb): return False

def test_get_ssl_info_valid_cert(monkeypatch):
    # far-future expiry
    na = "Dec 31 23:59:59 2099 GMT"
    cert = {"notAfter": na}

    class FakeCtx:
        def wrap_socket(self, sock, server_hostname=None):
            return _FakeSSLSocket(cert)

    monkeypatch.setattr(M.ssl, "create_default_context", lambda: FakeCtx())

    info = M.get_ssl_info("example.com")
    assert info["valid"] is True
    assert info["expires"].startswith("2099-12-31T23:59:59")

def test_get_ssl_info_error_path(monkeypatch):
    class BadCtx:
        def wrap_socket(self, *a, **k):
            raise RuntimeError("no tls")

    monkeypatch.setattr(M.ssl, "create_default_context", lambda: BadCtx())
    assert M.get_ssl_info("example.com") == {"valid": False, "expires": "Unknown"}


# ---------------- get_dns_records ----------------

def test_get_dns_records_mixed_success_and_failure(monkeypatch):
    class FakeAns:
        def __init__(self, txt): self._t = txt
        def to_text(self): return self._t

    def fake_resolve(domain, rtype):
        if rtype == "MX":
            return [FakeAns("10 mail.example.com.")]
        if rtype == "NS":
            return [FakeAns("ns1.example.com."), FakeAns("ns2.example.com.")]
        if rtype == "TXT":
            raise TimeoutError("slow")
        raise Exception("unexpected")

    monkeypatch.setattr(M.dns.resolver, "resolve", fake_resolve)

    recs = M.get_dns_records("example.com")
    assert recs["MX"] == ["10 mail.example.com."]
    assert recs["NS"] == ["ns1.example.com.", "ns2.example.com."]
    # Failure returns ["Unavailable: <ExcName>"]
    assert isinstance(recs["TXT"], list) and recs["TXT"][0].startswith("Unavailable: TimeoutError")


# ---------------- gather_forensics ----------------

def test_gather_forensics_happy_path(monkeypatch):
    # Normalize domain via tldextract
    monkeypatch.setattr(
        M.tldextract, "extract",
        lambda d: types.SimpleNamespace(domain="example", suffix="com")
    )
    # IP + reverse
    monkeypatch.setattr(M.socket, "gethostbyname", lambda d: "93.184.216.34")
    monkeypatch.setattr(M.socket, "gethostbyaddr", lambda ip: ("example.com", [], []))

    # WHOIS object with expected attributes + dict conversion
    class DummyWhois:
        registrar = "Example Registrar"
        org = None
        name = "Jane Doe"
        def __iter__(self):
            # used only for dict(w) in code
            return iter({"registrar": self.registrar}.items())

    # Swap in a whois object that exposes .whois()
    monkeypatch.setattr(M, "whois", types.SimpleNamespace(whois=lambda d: DummyWhois()))

    # Avoid real SSL/DNS: stub our own functions in module
    monkeypatch.setattr(M, "get_ssl_info", lambda d: {"valid": True, "expires": "2099-12-31T23:59:59"})
    monkeypatch.setattr(M, "get_dns_records", lambda d: {"MX": [], "NS": [], "TXT": []})

    out = M.gather_forensics("https://Example.com/path")
    assert out["ip"] == "93.184.216.34"
    assert out["reverseIp"] == "example.com"
    assert out["registrar"] == "Example Registrar"
    assert out["whoisOwner"] == "Jane Doe"
    assert out["whoisRaw"]["registrar"] == "Example Registrar"
    assert out["sslValid"] is True
    assert out["sslExpires"] == "2099-12-31T23:59:59"
    assert out["dns"] == {"MX": [], "NS": [], "TXT": []}

def test_gather_forensics_handles_reverse_herror(monkeypatch):
    # tld -> example.com
    monkeypatch.setattr(
        M.tldextract, "extract",
        lambda d: types.SimpleNamespace(domain="example", suffix="com")
    )
    # IP ok
    monkeypatch.setattr(M.socket, "gethostbyname", lambda d: "93.184.216.34")
    # Reverse lookup raises socket.herror
    class HErr(Exception): pass
    monkeypatch.setattr(M.socket, "herror", HErr)
    def raise_herr(ip): raise HErr("no rdns")
    monkeypatch.setattr(M.socket, "gethostbyaddr", lambda ip: raise_herr(ip))

    # WHOIS & SSL/DNS stubs
    class DummyW:
        registrar = None
        org = None
        name = None
        def __iter__(self): return iter({})
    monkeypatch.setattr(M, "whois", types.SimpleNamespace(whois=lambda d: DummyW()))
    monkeypatch.setattr(M, "get_ssl_info", lambda d: {"valid": False, "expires": "Unknown"})
    monkeypatch.setattr(M, "get_dns_records", lambda d: {"MX": [], "NS": [], "TXT": []})

    out = M.gather_forensics("http://example.com")
    assert out["reverseIp"] == "Unknown"
    # registrar / owner defaults when missing
    assert out["registrar"] in ("Unavailable", None) or out["registrar"] == "Unavailable"
    assert out["whoisOwner"] in ("Unknown", None) or out["whoisOwner"] == "Unknown"
