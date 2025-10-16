# tests/test_threat_utils.py
import os
import re
import importlib
import responses
import pytest

# Utility to reload module with a specific env for IPINFO_TOKEN
def _reload_with_token(token: str | None):
    mod_name = "src.forensics.threat_utils"
    if token is None:
        os.environ.pop("IPINFO_TOKEN", None)
    else:
        os.environ["IPINFO_TOKEN"] = token
    # Remove cached module then import fresh so IPINFO_TOKEN is read at import time
    if mod_name in list(importlib.sys.modules):
        importlib.sys.modules.pop(mod_name)
    return importlib.import_module(mod_name)


def test_get_geo_info_unavailable_ip():
    threat_utils = _reload_with_token(None)
    assert threat_utils.get_geo_info("") == {}
    assert threat_utils.get_geo_info(None) == {}
    assert threat_utils.get_geo_info("Unavailable") == {}


@responses.activate
def test_ipinfo_success_without_token():
    threat_utils = _reload_with_token(None)

    ip = "8.8.8.8"
    # No token param expected; simple URL match
    responses.add(
        responses.GET,
        f"https://ipinfo.io/{ip}/json",
        json={
            "org": "AS15169 Google LLC",
            "country": "US",
            "region": "California",
            "city": "Mountain View",
        },
        status=200,
    )

    data = threat_utils.get_geo_info(ip)
    assert data["asn"].startswith("AS15169")
    assert data["country"] == "US"
    assert data["region"] == "California"
    assert data["city"] == "Mountain View"
    # Exactly one request went to ipinfo
    assert len(responses.calls) == 1
    assert responses.calls[0].request.url == f"https://ipinfo.io/{ip}/json"


@responses.activate
def test_ipinfo_success_with_token_in_querystring():
    threat_utils = _reload_with_token("abc123")

    ip = "1.1.1.1"
    # ipinfo will be called with ?token=abc123; use regex to ignore ordering/encoding
    url_re = re.compile(rf"https://ipinfo\.io/{re.escape(ip)}/json\?token=abc123$")
    responses.add(
        responses.GET,
        url_re,
        json={
            "org": "AS13335 Cloudflare, Inc.",
            "country": "US",
            "region": "California",
            "city": "Los Angeles",
        },
        status=200,
    )

    data = threat_utils.get_geo_info(ip)
    assert data["asn"].startswith("AS13335")
    assert data["city"] == "Los Angeles"
    assert len(responses.calls) == 1
    assert re.search(r"\?token=abc123", responses.calls[0].request.url)


@responses.activate
def test_fallback_to_ipapi_when_ipinfo_fails():
    threat_utils = _reload_with_token(None)

    ip = "9.9.9.9"
    # Make ipinfo fail with a network-like error
    responses.add(
        responses.GET,
        f"https://ipinfo.io/{ip}/json",
        body=Exception("ipinfo down"),
    )
    # ipapi succeeds
    responses.add(
        responses.GET,
        f"https://ipapi.co/{ip}/json",
        json={
            "asn": "AS19281",
            "country": "US",
            "region": "NY",
            "city": "New York",
        },
        status=200,
    )

    data = threat_utils.get_geo_info(ip)
    assert data["asn"] == "AS19281"
    assert data["country"] in ("US", "United States")
    assert data["city"] == "New York"
    # Two calls total: ipinfo then ipapi
    assert len(responses.calls) == 2
    assert responses.calls[0].request.url.endswith("/9.9.9.9/json")
    assert responses.calls[1].request.url.endswith("/9.9.9.9/json")


@responses.activate
def test_both_providers_fail_returns_empty_dict():
    threat_utils = _reload_with_token(None)

    ip = "203.0.113.7"
    responses.add(
        responses.GET,
        f"https://ipinfo.io/{ip}/json",
        body=Exception("fail1"),
    )
    responses.add(
        responses.GET,
        f"https://ipapi.co/{ip}/json",
        body=Exception("fail2"),
    )

    data = threat_utils.get_geo_info(ip)
    assert data == {}
    assert len(responses.calls) == 2
