import os
import importlib
import sys
import pytest


def _reload_proxy(env=None):
    # Reset env for the proxy module
    for k in ("PROXY_URL", "PROXY_USERNAME", "PROXY_PASSWORD"):
        os.environ.pop(k, None)
    if env:
        os.environ.update(env)

    # Reload module so its top-level globals (URL/USER/PASS) refresh
    if "src.utils.proxy" in sys.modules:
        del sys.modules["src.utils.proxy"]
    return importlib.import_module("src.utils.proxy")


def test_requests_proxies_none_when_url_missing():
    proxy_mod = _reload_proxy({})
    assert proxy_mod.requests_proxies() is None
    assert proxy_mod.playwright_proxy() is None


def test_requests_and_playwright_without_auth():
    proxy_mod = _reload_proxy({"PROXY_URL": "http://10.0.0.5:3128"})
    # requests: both http/https map to the raw URL when no auth
    out = proxy_mod.requests_proxies()
    assert out == {
        "http": "http://10.0.0.5:3128",
        "https": "http://10.0.0.5:3128",
    }
    # playwright: server only, no username/password
    pw = proxy_mod.playwright_proxy()
    assert pw == {"server": "http://10.0.0.5:3128"}


def test_requests_and_playwright_with_auth_and_port():
    proxy_mod = _reload_proxy({
        "PROXY_URL": "http://192.168.1.10:8080",
        "PROXY_USERNAME": "alice",
        "PROXY_PASSWORD": "s3cr3t",
    })
    # requests: URL with embedded auth (host and explicit port kept)
    out = proxy_mod.requests_proxies()
    assert out == {
        "http": "http://alice:s3cr3t@192.168.1.10:8080",
        "https": "http://alice:s3cr3t@192.168.1.10:8080",
    }
    # playwright: server stays raw URL; auth split into fields
    pw = proxy_mod.playwright_proxy()
    assert pw == {
        "server": "http://192.168.1.10:8080",
        "username": "alice",
        "password": "s3cr3t",
    }


def test_requests_auth_with_default_port_when_missing():
    # No port in PROXY_URL → requests_proxies should default to :3128 for the auth-embedded URL
    proxy_mod = _reload_proxy({
        "PROXY_URL": "http://10.0.0.9",
        "PROXY_USERNAME": "u",
        "PROXY_PASSWORD": "p",
    })
    out = proxy_mod.requests_proxies()
    assert out == {
        "http": "http://u:p@10.0.0.9:3128",
        "https": "http://u:p@10.0.0.9:3128",
    }
    # playwright keeps the raw URL (no default port added)
    pw = proxy_mod.playwright_proxy()
    assert pw == {
        "server": "http://10.0.0.9",
        "username": "u",
        "password": "p",
    }
