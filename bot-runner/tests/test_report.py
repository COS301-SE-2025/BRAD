# tests/test_report.py
import pytest

# ⬇️ Adjust import path to match your tree
from src.forensics.report import ForensicReport

def test_forensic_report_run_happy_path(monkeypatch):
    # ---- Stubs for dependencies ----
    fake_forensics = {
        "domain": "example.com",
        "ip": "93.184.216.34",
        "sslValid": True,
        "sslExpires": "2099-12-31T23:59:59",
        "dns": {"MX": [], "NS": [], "TXT": [], "DMARC": []},
        "geo": {"country": "US"},
        "timestamp": "2099-01-01T00:00:00",
    }
    fake_stats = {"domain_age_days": 123, "http_redirects": 0, "tld": "com"}
    fake_score = 42.0
    fake_reasons = {"ssl": "valid certificate", "age": "domain not too new"}
    fake_label = "Medium"

    # Patch the collaborators used inside run()
    monkeypatch.setattr("src.forensics.report.gather_forensics", lambda d: fake_forensics)
    monkeypatch.setattr("src.forensics.report.calculate_stats", lambda f: fake_stats)
    monkeypatch.setattr(
        "src.forensics.report.calculate_risk_score_with_reasons",
        lambda stats, forensics: (fake_score, fake_reasons),
    )
    monkeypatch.setattr("src.forensics.report.risk_label", lambda score: fake_label)

    r = ForensicReport("https://Example.com/login")
    # initial defaults
    assert r.forensics == {}
    assert r.stats == {}
    assert r.risk_score == 0.0
    assert r.risk_reasons == {}
    assert r.risk_level == "Low"

    r.run()

    # After run(): fields should be populated
    assert r.domain == "https://Example.com/login"  # you keep original input as provided
    assert r.forensics is fake_forensics
    assert r.stats is fake_stats
    assert r.risk_score == fake_score
    assert r.risk_reasons is fake_reasons
    assert r.risk_level == fake_label

    # to_dict() should merge correctly
    out = r.to_dict()
    # domain appears once; forensics keys also present
    assert out["domain"] == "example.com"           # normalized from gather_forensics
    assert r.domain == "https://Example.com/login"  # original preserved on the object
    assert out["ip"] == "93.184.216.34"
    assert out["sslValid"] is True
    assert out["stats"] == fake_stats
    assert out["riskScore"] == fake_score
    assert out["riskReasons"] == fake_reasons
    assert out["riskLevel"] == "Medium"

def test_forensic_report_run_edge_minimal(monkeypatch):
    # Minimal/unknown forensic data, ensure no crashes and sensible propagation
    fake_forensics = {
        "domain": "weird.invalid",
        "ip": "Unavailable",
        "sslValid": False,
        "sslExpires": "Unknown",
        "dns": {"MX": [], "NS": [], "TXT": [], "DMARC": []},
        "geo": {},
        "timestamp": "2025-01-01T00:00:00",
    }
    fake_stats = {"domain_age_days": 0, "http_redirects": 0, "tld": "invalid"}
    # Scoring returns low score with reason
    fake_score = 5.0
    fake_reasons = {"ssl": "no valid cert"}
    fake_label = "Low"

    monkeypatch.setattr("src.forensics.report.gather_forensics", lambda d: fake_forensics)
    monkeypatch.setattr("src.forensics.report.calculate_stats", lambda f: fake_stats)
    monkeypatch.setattr(
        "src.forensics.report.calculate_risk_score_with_reasons",
        lambda stats, forensics: (fake_score, fake_reasons),
    )
    monkeypatch.setattr("src.forensics.report.risk_label", lambda score: fake_label)

    r = ForensicReport("weird.invalid")
    r.run()
    out = r.to_dict()

    assert out["domain"] == "weird.invalid"
    assert out["ip"] == "Unavailable"
    assert out["sslValid"] is False
    assert out["riskScore"] == 5.0
    assert out["riskLevel"] == "Low"
    assert out["riskReasons"] == {"ssl": "no valid cert"}

def test_forensic_report_logging_calls(monkeypatch):
    # Stub collaborators
    fake_forensics = {"domain": "example.com"}
    fake_stats = {}
    monkeypatch.setattr("src.forensics.report.gather_forensics", lambda d: fake_forensics)
    monkeypatch.setattr("src.forensics.report.calculate_stats", lambda f: fake_stats)
    monkeypatch.setattr(
        "src.forensics.report.calculate_risk_score_with_reasons",
        lambda *a: (0.0, {}),
    )
    monkeypatch.setattr("src.forensics.report.risk_label", lambda s: "Low")

    # Stub the module-level logger to capture messages
    class DummyLogger:
        def __init__(self):
            self.debugs = []
            self.infos = []
            self.errors = []
        def debug(self, msg):
            self.debugs.append(str(msg))
        def info(self, msg):
            self.infos.append(str(msg))
        def error(self, msg):
            self.errors.append(str(msg))

    dummy = DummyLogger()
    monkeypatch.setattr("src.forensics.report.logger", dummy, raising=True)

    # Run
    r = ForensicReport("example.com")
    r.run()

    # Assert we logged what we expect (don’t over-specify)
    assert any("Starting forensic analysis" in m for m in dummy.infos)
    assert any("Risk level for" in m for m in dummy.infos)
    # And some debug lines happened during the pipeline
    assert len(dummy.debugs) >= 2

    
def test_forensic_report_integration(monkeypatch):
    # This test does not stub dependencies, so it will use real implementations.
    # It checks that the pipeline runs end-to-end without crashing and produces expected keys.
    r = ForensicReport("github.com")
    r.run()
    out = r.to_dict()
    # Check that output dict has expected keys
    assert "domain" in out
    assert "ip" in out
    assert "sslValid" in out
    assert "stats" in out
    assert "riskScore" in out
    assert "riskReasons" in out
    assert "riskLevel" in out

