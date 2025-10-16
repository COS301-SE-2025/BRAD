# tests/test_stats.py
import pytest
from datetime import datetime, timezone, timedelta

from src.forensics.stats import compute_domain_age_days, calculate_stats


def test_compute_domain_age_days_none_returns_none():
    assert compute_domain_age_days({"creation_date": None}) is None
    assert compute_domain_age_days({}) is None


def test_compute_domain_age_days_parses_iso_aware():
    created = datetime(2020, 1, 1, 12, 0, tzinfo=timezone.utc).isoformat()
    days = compute_domain_age_days({"creation_date": created})
    assert isinstance(days, int)
    assert days >= (datetime.now(timezone.utc) - datetime(2020, 1, 1, 12, 0, tzinfo=timezone.utc)).days - 1


def test_compute_domain_age_days_parses_list_and_naive_to_utc():
    # naive datetime string (no tz) – should be treated as UTC
    naive_str = "2023-06-15T00:00:00"
    days = compute_domain_age_days({"creation_date": [naive_str]})
    assert isinstance(days, int)
    assert days >= 0


def test_compute_domain_age_days_future_date_returns_none():
    future = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    assert compute_domain_age_days({"creation_date": future}) is None


def test_calculate_stats_basic_fields_present():
    forensics = {
        "whoisRaw": {"creation_date": "2020-05-01T00:00:00Z"},
        "sslExpires": "2099-12-31T23:59:59Z",
        "dns": {
            "MX": ["10 mail.example.com."],
            "NS": ["ns1.example.com.", "ns2.example.com."],
            "TXT": ['"v=spf1 -all"'],
            "DMARC": ['"v=DMARC1; p=reject"'],
        },
    }
    stats = calculate_stats(forensics)
    assert set(stats.keys()) >= {"domain_age_days", "domain_created", "ssl_days_remaining", "dns"}
    assert isinstance(stats["domain_age_days"], int)
    assert stats["domain_created"] == "2020-05-01"
    assert isinstance(stats["ssl_days_remaining"], int)
    assert stats["dns"]["mx_count"] == 1
    assert stats["dns"]["ns_count"] == 2
    assert stats["dns"]["has_spf"] is True
    assert stats["dns"]["has_dmarc"] is True


def test_calculate_stats_handles_unknown_ssl_and_missing_whois():
    forensics = {
        "sslExpires": "Unknown",
        "dns": {"MX": [], "NS": [], "TXT": [], "DMARC": []},
    }
    stats = calculate_stats(forensics)
    assert stats["domain_age_days"] is None
    assert stats["domain_created"] is None
    assert stats["ssl_days_remaining"] is None
    assert stats["dns"]["mx_count"] == 0
    assert stats["dns"]["ns_count"] == 0
    assert stats["dns"]["has_spf"] is False
    assert stats["dns"]["has_dmarc"] is False


def test_calculate_stats_parses_ssl_days_remaining_tz_aware_and_naive():
    # Aware expiry (UTC)
    future_aware = (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
    stats1 = calculate_stats({"sslExpires": future_aware, "dns": {}})
    assert 10 <= stats1["ssl_days_remaining"] <= 20

    # Naive expiry – should be assumed UTC
    future_naive = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S")
    stats2 = calculate_stats({"sslExpires": future_naive, "dns": {}})
    assert 5 <= stats2["ssl_days_remaining"] <= 9


def test_calculate_stats_dmarc_detection_from_dmarc_array_and_txt_fallback():
    # DMARC via DMARC array
    stats_a = calculate_stats({
        "dns": {
            "MX": ["10 mx.foo"],
            "NS": ["ns1"],
            "TXT": [],
            "DMARC": ['"v=DMARC1; p=reject"'],
        }
    })
    assert stats_a["dns"]["has_dmarc"] is True

    # DMARC via TXT fallback (no explicit DMARC array)
    stats_b = calculate_stats({
        "dns": {
            "MX": ["10 mx.foo"],
            "NS": ["ns1"],
            "TXT": ['"something"', '"v=DMARC1; p=none"'],
            "DMARC": [],
        }
    })
    assert stats_b["dns"]["has_dmarc"] is True


def test_calculate_stats_spf_detection_from_txt():
    stats = calculate_stats({
        "dns": {
            "MX": ["10 mx.foo"],
            "NS": ["ns1", "ns2"],
            "TXT": ['"spf1 nope"', '"v=spf1 include:foo -all"'],
            "DMARC": [],
        }
    })
    assert stats["dns"]["has_spf"] is True


def test_calculate_stats_counts_ns_and_mx_even_when_missing_lists():
    stats = calculate_stats({"dns": {}})
    assert stats["dns"]["mx_count"] == 0
    assert stats["dns"]["ns_count"] == 0


def test_calculate_stats_ssl_parse_failure_logs_and_sets_none(monkeypatch):
    # Force parse error
    bad = {"sslExpires": "not-a-date", "dns": {}}
    # We won't assert on logs; just ensure it doesn't crash and sets None
    stats = calculate_stats(bad)
    assert stats["ssl_days_remaining"] is None
