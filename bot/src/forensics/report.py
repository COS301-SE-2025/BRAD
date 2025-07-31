from .forensics import gather_forensics
from .stats import calculate_stats
from .scoring import calculate_risk_score_with_reasons, risk_label

class ForensicReport:
    def __init__(self, domain: str):
        self.domain = domain
        self.forensics = {}
        self.stats = {}
        self.risk_score = 0.0
        self.risk_reasons = {}
        self.risk_level = "Low"

    def run(self):
        self.forensics = gather_forensics(self.domain)
        self.stats = calculate_stats(self.forensics)
        self.risk_score, self.risk_reasons = calculate_risk_score_with_reasons(self.stats, self.forensics)
        self.risk_level = risk_label(self.risk_score)

    def to_dict(self):
        return {
            "domain": self.domain,
            **self.forensics,
            "stats": self.stats,
            "riskScore": self.risk_score,
            "riskReasons": self.risk_reasons,
            "riskLevel": self.risk_level,
        }
