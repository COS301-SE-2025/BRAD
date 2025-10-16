# tests/integration/test_forensics_integration.py
import pytest
import src.forensics.forensics as F

@pytest.mark.integration
def test_gather_forensics_fields(monkeypatch):
    monkeypatch.setattr(F, "get_whois_info", lambda d: {
        "registrar": "TEST REG",
        "whoisOwner": "Example Org",
        "whoisRaw": "stubbed whois text",
        # optional extra fields if your code logs them
        "creation_date": "2020-01-01T00:00:00Z",
        "updated_date": "2024-01-01T00:00:00Z",
    })

    report = F.gather_forensics("example.com")

    assert "ip" in report and isinstance(report["ip"], str)
    assert "dns" in report and isinstance(report["dns"], dict)
    assert report["registrar"] == "TEST REG"
    assert report["whoisOwner"] == "Example Org"
    assert isinstance(report["whoisRaw"], str)
