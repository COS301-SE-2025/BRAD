# tests/test_scoring_logic.py
import pytest

from src.forensics.scoring import (
    calculate_risk_score_with_reasons,
    risk_label,
)

# Helpers to build minimal inputs
def base_stats(**overrides):
    s = {
        "domain_age_days": 365,         # mature by default
        "ssl_days_remaining": 365,      # valid by default
        "dns": {
            "mx_count": 0,
            "ns_count": 2,
            "has_spf": False,
            "has_dmarc": False,
        },
    }
    # allow replacing nested dns keys easily
    if "dns" in overrides:
        s["dns"].update(overrides.pop("dns"))
    s.update(overrides)
    return s

def base_forensics(**overrides):
    f = {
        "domain": "safe.example",       # not in allowlist or threat lists by default
        "ip": "203.0.113.5",
        "reverseIp": "host.example.net",
        "geo": {"country": None},
    }
    f.update(overrides)
    return f


def test_domain_age_unknown_not_penalized():
    stats = base_stats(domain_age_days=None)  # unknown
    forensics = base_forensics()
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)

    # No other penalties present; score should be 0.0
    assert score == 0.0
    assert "new_domain" in reasons
    assert "unknown" in reasons["new_domain"].lower()


def test_ssl_expired_adds_point_2():
    stats = base_stats(ssl_days_remaining=-1)
    forensics = base_forensics()
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)
    assert score == 2.0    # 0.2 * 10
    assert "expired" in reasons["ssl_expired"].lower()


def test_ssl_expiring_soon_adds_0_05():
    stats = base_stats(ssl_days_remaining=7)
    forensics = base_forensics()
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)
    assert score == 0.5    # 0.05 * 10
    assert "expiring" in reasons["ssl_expired"].lower()


def test_dns_with_mx_missing_spf_and_dmarc_adds_0_2():
    stats = base_stats(dns={"mx_count": 1, "has_spf": False, "has_dmarc": False})
    forensics = base_forensics()
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)
    # 0.10 (SPF) + 0.10 (DMARC) = 0.20 → 2.0
    assert score == 2.0
    assert "missing" in reasons["spf_missing"].lower()
    assert "missing" in reasons["dmarc_missing"].lower()


def test_ns_low_and_high_penalties_are_applied_separately():
    # Low NS (<2) -> +0.10
    stats_low = base_stats(dns={"ns_count": 1})
    score_low, reasons_low = calculate_risk_score_with_reasons(stats_low, base_forensics())
    assert score_low == 1.0
    assert "single point of failure" in reasons_low["ns_health"].lower()

    # High NS (>8) -> +0.05
    stats_high = base_stats(dns={"ns_count": 9})
    score_high, reasons_high = calculate_risk_score_with_reasons(stats_high, base_forensics())
    assert score_high == 0.5
    assert "unusually high" in reasons_high["ns_health"].lower()


def test_reverse_ip_suspicious_keyword_adds_point_1():
    stats = base_stats()
    forensics = base_forensics(reverseIp="srv1.contabo.host")
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)
    assert score == 1.0    # 0.1 * 10
    assert "suspicious" in reasons["reverse_ip_suspicious"].lower()


def test_threat_domain_and_ip_each_add_point_5_and_cap_to_10():
    stats = base_stats()
    forensics = base_forensics(domain="malware-example.com", ip="66.66.66.66")
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)

    assert score == 10.0
    # keys exist:
    assert "threat_domain_match" in reasons
    assert "threat_ip_match" in reasons
    # optional: content sanity (looser)
    assert "threat" in reasons["threat_domain_match"].lower()
    assert "threat" in reasons["threat_ip_match"].lower()


def test_geo_risk_applies_only_with_gate():
    # Young domain triggers the gate
    stats_young = base_stats(domain_age_days=10)  # adds +0.3 on its own

    # Baseline: not risky country
    base_score, base_reasons = calculate_risk_score_with_reasons(
        stats_young, base_forensics(geo={"country": "ZA"})
    )

    # Gate met: risky country + young domain
    gate_score, gate_reasons = calculate_risk_score_with_reasons(
        stats_young, base_forensics(geo={"country": "RU"})
    )

    # Geo gate adds exactly +0.10 → +1.0 after scaling
    assert round(gate_score - base_score, 2) == 1.0
    assert "geo_risk" in gate_reasons and "higher-risk" in gate_reasons["geo_risk"].lower()



def test_allowlist_bias_reduces_score_once():
    stats = base_stats(ssl_days_remaining=-1)
    forensics = base_forensics(domain="example.com")  # in ALLOWLIST_DOMAINS
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)

    assert score == 0.8  # 0.2 - 0.12 => 0.08 -> x10 => 0.8
    assert "allowlist_bias" in reasons                    # key exists
    # optional, looser content check:
    assert any(w in reasons["allowlist_bias"].lower() for w in ("training", "sandbox", "forgive"))



def test_domain_age_under_30_adds_small_penalty():
    stats = base_stats(domain_age_days=5)        # +0.3
    forensics = base_forensics()
    score, reasons = calculate_risk_score_with_reasons(stats, forensics)
    assert score == 3.0      # 0.3 * 10
    assert "< 30" in reasons["new_domain"]


@pytest.mark.parametrize(
    "val,expected",
    [
        (0, "Low"),
        (3.99, "Low"),
        (4, "Medium"),
        (6.99, "Medium"),
        (7, "High"),
        (10, "High"),
    ],
)
def test_risk_label_thresholds(val, expected):
    assert risk_label(val) == expected
