from .forensics import gather_forensics
from .stats import calculate_stats
from .scoring import calculate_risk_score_with_reasons, risk_label
from ..utils.logger import get_logger  

logger = get_logger(__name__)

class ForensicReport:
    def __init__(self, domain: str):
        self.domain = domain
        self.forensics = {}
        self.stats = {}
        self.risk_score = 0.0
        self.risk_reasons = {}
        self.risk_level = "Low"

        logger.debug(f"Initialized ForensicReport for domain: {domain}")

    def run(self):
        logger.info(f"[Forensics] Starting forensic analysis for {self.domain}")

        # Step 1: Gather forensic data
        logger.debug("[Forensics] Gathering WHOIS, DNS, and SSL information...")
        self.forensics = gather_forensics(self.domain)
        logger.debug(f"[Forensics] Gathered data: {self.forensics}")

        # Step 2: Calculate statistics
        logger.debug("[Forensics] Calculating statistics from gathered data...")
        self.stats = calculate_stats(self.forensics)
        logger.debug(f"[Forensics] Calculated stats: {self.stats}")

        # Step 3: Calculate risk score & reasons
        logger.debug("[Forensics] Calculating risk score with reasons...")
        self.risk_score, self.risk_reasons = calculate_risk_score_with_reasons(self.stats, self.forensics)
        logger.debug(f"[Forensics] Risk score: {self.risk_score}, Reasons: {self.risk_reasons}")

        # Step 4: Determine risk level
        self.risk_level = risk_label(self.risk_score)
        logger.info(f"[Forensics] Risk level for {self.domain}: {self.risk_level} ({self.risk_score})")

    def to_dict(self):
        return {
            "domain": self.domain,
            **self.forensics,
            "stats": self.stats,
            "riskScore": self.risk_score,
            "riskReasons": self.risk_reasons,
            "riskLevel": self.risk_level,
        }
