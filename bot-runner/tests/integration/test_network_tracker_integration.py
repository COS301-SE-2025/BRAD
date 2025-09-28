# tests/integration/test_network_tracker_integration.py
import pytest
from src.scraper.network_tracker import NetworkTracker

@pytest.mark.integration
def test_network_tracker_summary_counts():
    tr = NetworkTracker()

    # Simulate lifecycle
    tr.requests_total += 2
    tr.responses_total += 1
    tr.error_count += 1
    tr.status_counts = {200: 1, 500: 1}

    tr.mark_start()
    tr.mark_end()

    summary = tr.to_summary()
    assert summary["requests"] == 2
    assert summary["responses"] == 1
    assert summary["errors"] == 1
    assert summary["statusCounts"] == {200: 1, 500: 1}
    assert summary["durationMs"] is not None
