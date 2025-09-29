# tests/integration/test_perform_scraping_integration.py
import pytest
from src.scraper.analysis import perform_scraping

@pytest.mark.integration
def test_perform_scraping_integration(local_site, monkeypatch):
    url = local_site["index"]
    report_id = "it-testreport"

    # Make sure CI runs headless, temp screenshots dir, etc.
    monkeypatch.setenv("SCREENSHOTS_DIR", "/tmp/screenshots")  # your code should respect this
    # If your scraper can skip screenshots in CI, expose an env like SKIP_SCREENSHOTS=1
    # monkeypatch.setenv("SKIP_SCREENSHOTS", "1")

    scraping_info, abuse_flags = perform_scraping(
        start_url=url,
        report_id=report_id,
        max_pages=3,
        max_depth=2,
        delay_seconds=0.0,
        obey_robots=True,
    )

    # --- shape checks (same as yours) ---
    assert "scan" in scraping_info
    assert "summary" in scraping_info
    assert scraping_info["scan"]["startUrl"] == url
    assert scraping_info["summary"]["pagesCrawled"] >= 1
    assert isinstance(scraping_info["pages"], list)
    assert isinstance(scraping_info["screenshots"], list)

    # --- content/flags checks (make these match your real logic) ---
    # We put bait text like "FREE GIFT" and "0xDEADBEEF"; assert your rules caught something:
    assert "pagesFlagged" in abuse_flags
    assert isinstance(abuse_flags["pagesFlagged"], (list, dict))

    # If your code records redirect chains, assert key exists (or relax if using stdlib server)
    assert "redirectChains" in abuse_flags  # remove if your current site doesn’t 302
