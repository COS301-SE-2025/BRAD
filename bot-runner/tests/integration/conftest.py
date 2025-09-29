# tests/integration/conftest.py
import contextlib, os, socket, threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path

import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

class _Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):  # quiet logs
        pass

def _find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

@contextlib.contextmanager
def served_dir(root: Path, port: int):
    cwd = os.getcwd()
    os.chdir(root)
    try:
        httpd = HTTPServer(("127.0.0.1", port), _Handler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        yield f"http://127.0.0.1:{port}"
    finally:
        httpd.shutdown()
        t.join()
        os.chdir(cwd)

import pytest

@pytest.fixture(scope="module")
def local_site(tmp_path_factory):
    # Create a tiny site
    root = tmp_path_factory.mktemp("site")
    (root / "index.html").write_text(
        """<!doctype html><title>Home</title>
        <a href="/page2.html">next</a>
        <a href="/redir">redir</a>
        <p>FREE GIFT!!! click now</p>""",
        encoding="utf-8",
    )
    (root / "page2.html").write_text(
        """<!doctype html><title>Page2</title>
        <p>Some content with suspicious pattern 0xDEADBEEF</p>""",
        encoding="utf-8",
    )
    # Redirect handled by a tiny handler via HTML meta won’t 302; instead make an endpoint file
    # We’ll emulate a redirect with a simple HTML that JS-free scrapers treat as another page.
    (root / "final.html").write_text("<!doctype html><title>Final</title>", encoding="utf-8")

    # robots that allows everything
    (root / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")

    # a “/redir” path: simplest is a static 302 mapping via an extra handler;
    # since we’re using SimpleHTTPRequestHandler, emulate with a file link:
    # If your scraper follows only real 30x, skip this and assert without redirectChains,
    # or swap to pytest-httpserver for a true 302. See alternative below.

    port = _find_free_port()
    with served_dir(root, port) as base:
        yield {
            "base": base,
            "index": f"{base}/index.html",
            "page2": f"{base}/page2.html",
            "final": f"{base}/final.html",
            "robots": f"{base}/robots.txt",
        }
