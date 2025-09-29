import pytest, json
import src.utils.reporter as reporter

@pytest.mark.integration
def test_report_analysis_sends_patch(monkeypatch):
    captured = {}

    class FakeResp:
        status_code = 200
        text = "ok"
        def raise_for_status(self): return None

    def fake_patch(url, data=None, timeout=None, **_):
        captured["url"] = url
        captured["data"] = data
        captured["timeout"] = timeout
        return FakeResp()

    monkeypatch.setattr(reporter._SESSION, "patch", fake_patch)

    ok = reporter.report_analysis(
        "it-123",
        {"domain": "example.com", "riskScore": 0.5},          # analysis_data
        {"summary": {"pagesCrawled": 1}, "pages": []},        # scraping_info
        {"pagesFlagged": [], "redirectChains": []},           # abuse_flags
    )

    assert ok is True
    assert "/reports/it-123/analysis" in captured["url"]

    body = json.loads(captured["data"])
    assert body["analysis"]["domain"] == "example.com"
    assert body["analysis"]["riskScore"] == 0.5
    assert body["scrapingInfo"]["summary"]["pagesCrawled"] == 1
    assert "abuseFlags" in body and isinstance(body["abuseFlags"], dict)
    # optional: verify empties were dropped by serialize()
    assert body["abuseFlags"] == {}
    assert body["analysisStatus"] == "done"
