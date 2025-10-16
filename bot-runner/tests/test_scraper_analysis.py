# tests/test_scraper_analysis.py
import os
import io
import types
import pytest
from pathlib import Path
from urllib.parse import urlparse

# Import module under test
import src.scraper.analysis as A




# -------------------------------
# Helper fakes & monkeypatch utils
# -------------------------------
class FakeNetworkTracker:
    def __init__(self):
        self.requests_total = 0
        self.responses_total = 0
        self.error_count = 0
        self.http_on_https_attempts = 0
        self.status_counts = {}

    def mark_start(self): pass
    def mark_end(self): pass

    def to_summary(self):
        # simple, deterministic summary
        return {
            "startTime": "2025-01-01T00:00:00Z",
            "endTime": "2025-01-01T00:00:02Z",
            "requests": self.requests_total,
            "responses": self.responses_total,
            "errors": self.error_count,
            "httpOnHttpsAttempts": self.http_on_https_attempts,
        }


class _FakeReq:
    def __init__(self, url, method="GET", resource_type="document", redirected_from=None):
        self.url = url
        self.method = method
        self.resource_type = resource_type
        self.redirected_from = redirected_from


class _FakeResp:
    def __init__(self, url, status=200, headers=None, req=None):
        self.url = url
        self.status = status
        self._headers = headers or {}
        self._req = req or _FakeReq(url)

    @property
    def headers(self):
        return self._headers

    @property
    def request(self):
        return self._req


class FakePage:
    def __init__(self, html, final_url):
        self._handlers = {}
        self._html = html
        self.url = final_url

    def on(self, name, handler):
        self._handlers[name] = handler

    def goto(self, url, wait_until=None, timeout=None):
        # Simulate a redirect: http://example -> https://example
        r0 = _FakeReq("http://example.com", "GET", "document", redirected_from=None)
        r1 = _FakeReq("https://example.com", "GET", "document", redirected_from=r0)
        resp = _FakeResp("https://example.com", 200,
                         headers={"Content-Security-Policy": "upgrade-insecure-requests"},
                         req=r1)

        # Fire one "request" and two "response" events (one insecure subresource)
        if "request" in self._handlers:
            self._handlers["request"](_ReqShim("https://example.com", "GET", "document", self))
            # subresource requested via http (to count as mixed content)
            self._handlers["request"](_ReqShim("http://example.com/insecure.js", "GET", "script", self))

        if "response" in self._handlers:
            self._handlers["response"](_RespShim("https://example.com", 200, "https", method="GET", rtype="document"))
            self._handlers["response"](_RespShim("http://example.com/insecure.js", 200, "http", method="GET", rtype="script"))

        return resp

    def wait_for_timeout(self, ms): pass

    def screenshot(self, path=None, full_page=False):
        # ensure file exists so code path is exercised
        if path:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            Path(path).write_bytes(b"")

    def content(self):
        return self._html


class _ReqShim:
    def __init__(self, url, method, resource_type, page):
        self.url = url
        self.method = method
        self.resource_type = resource_type
        self._page = page


class _RespShim:
    def __init__(self, url, status, scheme, method="GET", rtype="document"):
        self.url = url
        self.status = status
        self.request = types.SimpleNamespace(method=method, resource_type=rtype)
        self._scheme = scheme


class FakeContext:
    def __init__(self, html, url):
        self._html = html
        self._url = url
    def new_page(self):
        return FakePage(self._html, self._url)
    def close(self): pass


class FakeBrowser:
    def __init__(self, html, url):
        self._html = html
        self._url = url
    def new_context(self, user_agent=None):
        return FakeContext(self._html, self._url)
    def close(self): pass


class FakeChromium:
    def __init__(self, html, url):
        self._html = html
        self._url = url
    def launch(self, headless=True, proxy=None):
        # ensure proxy arg is accepted
        return FakeBrowser(self._html, self._url)


class FakePlaywrightCM:
    """Context manager returned by sync_playwright()."""
    def __init__(self, html, url):
        self.chromium = FakeChromium(html, url)
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        return False


def _stub_sync_playwright(monkeypatch, html, url):
    def fake_sync_playwright():
        return FakePlaywrightCM(html, url)
    monkeypatch.setattr(A, "sync_playwright", fake_sync_playwright)


def _stub_proxies(monkeypatch, requests_proxy=None, pw_proxy=None):
    # prevent env/network dependencies
    monkeypatch.setattr(A, "requests_proxies", lambda: requests_proxy or None, raising=False)
    monkeypatch.setattr(A, "playwright_proxy", lambda: pw_proxy or None, raising=False)
    # also ensure the module-level SESSION is clean
    A.SESSION.proxies.clear()


def _stub_robots_allow_all(monkeypatch):
    class DummyR:
        default_entry = True
        def can_fetch(self, ua, url): return True
    monkeypatch.setattr(A, "_load_robots", lambda origin, ua, timeout=8: DummyR())


# -------------------------------
# Tests for internal helpers
# -------------------------------
def test_helpers_basic():
    assert A._origin("https://x.y/path?k=1") == "https://x.y"
    assert A._hash_html("<html></html>") == A._hash_html("<html></html>")
    assert A._mixed_content_counts("https", [{"protocol": "http"}, {"protocol": "https"}]) == 1
    assert A._mixed_content_counts("http", [{"protocol": "http"}]) == 0  # only counts if page is https
    # keyword scoring
    assert A._score_keywords("Please verify your login") >= 2
    # obfuscation detection (true) and benign jQuery fallback (false)
    assert A._looks_obfuscated_js("eval(function(p,a,c,k,e,d){} )")
    benign = """
        <script>
        if (!window.jQuery) { document.write('<script src="...jquery..."><\\/script>'); }
        </script>
    """
    assert A._looks_obfuscated_js(benign) is False
    # risk level / clamp
    assert A._risk_level(10) == "Low"
    assert A._risk_level(30) == "Medium"
    assert A._risk_level(80) == "High"
    assert A._clamp(200) == 100 and A._clamp(-5) == 0


# -------------------------------
# perform_scraping – happy path
# -------------------------------
def test_perform_scraping_happy_path(monkeypatch, tmp_path):
    html = """
    <html>
      <head>
        <title>Login portal</title>
        <meta http-equiv="refresh" content="0;url=/jump" />
      </head>
      <body>
        <h1>Verify your password</h1>
        <script>eval("evil")</script>
        <a href="/next">next</a>
        <form action="/submit"></form>
      </body>
    </html>
    """
    start_url = "https://example.com/"
    report_id = "rpt123"

    # Direct screenshots to a temp dir to avoid permission issues
    monkeypatch.setenv("SCREENSHOTS_DIR", str(tmp_path))
    _stub_sync_playwright(monkeypatch, html, start_url)
    _stub_proxies(monkeypatch, requests_proxy=None, pw_proxy=None)
    _stub_robots_allow_all(monkeypatch)
    # Replace NetworkTracker with a simple fake
    monkeypatch.setattr(A, "NetworkTracker", FakeNetworkTracker)

    # Run scraping (single page)
    scraping_info, abuse_flags = A.perform_scraping(
        start_url=start_url,
        report_id=report_id,
        max_pages=1,
        max_depth=0,
        delay_seconds=0.0,
        obey_robots=True,
        user_agent="TestUA/1.0",
        proxy_config=None,
        req_proxies=None,
    )

    # Basic shape assertions
    assert isinstance(scraping_info, dict) and isinstance(abuse_flags, dict)
    assert scraping_info["summary"]["pagesCrawled"] == 1
    assert scraping_info["summary"]["siteRiskLevel"] in {"Low", "Medium", "High"}
    assert scraping_info["network"]["requests"]  # sample exists

    # Page flags & reasons are captured
    pages = scraping_info["pages"]
    assert len(pages) == 1
    p0 = pages[0]
    assert f"{urlparse(p0['url']).scheme}://{urlparse(p0['url']).netloc}" == "https://example.com"
    assert p0["structuredInfo"]["forms"] == ["https://example.com/submit"]
    assert p0["flags"]["usesMetaRefresh"] is True
    assert p0["flags"]["obfuscatedScripts"] is True
    assert p0["flags"]["keywordMatches"] >= 1
    # Mixed content was detected (HTTP subresource on HTTPS page)
    assert p0["flags"]["httpOnHttpsCount"] >= 1

    # Abuse flags summarise what happened
    assert abuse_flags["globalSuspicion"]["anyMetaRefresh"] is True
    assert abuse_flags["globalSuspicion"]["anyObfuscation"] is True
    assert isinstance(abuse_flags["pagesFlagged"], list)


# -------------------------------
# perform_scraping – robots disallow blocks crawl
# -------------------------------
def test_perform_scraping_robots_disallow(monkeypatch, tmp_path):
    # robots disallow via stub
    class BlockAll:
        default_entry = True
        def can_fetch(self, ua, url): return False

    # Minimal HTML (won't be used because robots blocks)
    html = "<html><head><title>Nope</title></head><body></body></html>"
    start_url = "https://example.com/"
    report_id = "rptX"

    monkeypatch.setenv("SCREENSHOTS_DIR", str(tmp_path))
    _stub_sync_playwright(monkeypatch, html, start_url)
    _stub_proxies(monkeypatch)
    monkeypatch.setattr(A, "_load_robots", lambda origin, ua, timeout=8: BlockAll())
    monkeypatch.setattr(A, "NetworkTracker", FakeNetworkTracker)

    scraping_info, abuse_flags = A.perform_scraping(
        start_url=start_url,
        report_id=report_id,
        max_pages=3,
        max_depth=2,
        delay_seconds=0.0,
        obey_robots=True,         # robots enforced
        user_agent="TestUA/1.0",
    )

    # No pages crawled when robots disallow everything
    assert scraping_info["summary"]["pagesCrawled"] == 0
    assert scraping_info["summary"]["siteRiskScore"] == 5
    assert scraping_info["screenshots"] == []
    assert abuse_flags["pagesFlagged"] == []
