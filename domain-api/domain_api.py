import logging
import os
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, HTTPException
import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel
from typing import List
import re

# Configure logging
log_to_file = os.getenv("LOG_TO_FILE", "0") == "1"
log_dir = os.getenv("LOG_DIR", "/app/logs")
log_max_bytes = int(os.getenv("LOG_FILE_MAX_BYTES", 5242880))
log_backup_count = int(os.getenv("LOG_BACKUP_COUNT", 5))

logger = logging.getLogger("domain_api")
logger.setLevel(logging.INFO)
if log_to_file:
    os.makedirs(log_dir, exist_ok=True)
    handler = RotatingFileHandler(
        f"{log_dir}/domain_api.log",
        maxBytes=log_max_bytes,
        backupCount=log_backup_count
    )
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
else:
    logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Attempt to load the model
model = None
model_path = "domain_model.pkl"
if os.path.exists(model_path):
    try:
        model = joblib.load(model_path)
        logger.info("Model loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = None
else:
    logger.warning(f"{model_path} not found. Running without model (fallback mode).")

class DomainCheck(BaseModel):
    domain: str
    compare_to: List[str]

def dice_coefficient(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    bigrams_a = set(a[i:i+2] for i in range(len(a)-1))
    bigrams_b = set(b[i:i+2] for i in range(len(b)-1))
    intersection = len(bigrams_a & bigrams_b)
    return 2.0 * intersection / (len(bigrams_a) + len(bigrams_b)) if (len(bigrams_a) + len(bigrams_b)) > 0 else 0.0

def extract_features(domain: str, compare_domain: str) -> dict:
    logger.debug(f"Extracting features for domain: {domain}, compare_to: {compare_domain}")

    def normalize_domain(raw: str) -> str:
        s = raw.strip().lower()
        s = re.sub(r'^https?://', '', s)
        s = re.sub(r'/.*$', '', s)
        return s

    domain = normalize_domain(domain)
    compare_domain = normalize_domain(compare_domain)

    dice = dice_coefficient(domain, compare_domain)

    def levenshtein(a: str, b: str) -> int:
        if not a:
            return len(b)
        if not b:
            return len(a)
        m, n = len(a), len(b)
        dp = [[0] * (n + 1) for _ in range(2)]
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            dp[i % 2][0] = i
            for j in range(1, n + 1):
                cost = 0 if a[i - 1] == b[j - 1] else 1
                dp[i % 2][j] = min(
                    dp[(i - 1) % 2][j] + 1,
                    dp[i % 2][j - 1] + 1,
                    dp[(i - 1) % 2][j - 1] + cost
                )
        return dp[m % 2][n]

    lev = levenshtein(domain, compare_domain)
    lev_norm = 1 - lev / max(1, max(len(domain), len(compare_domain)))

    def ngram_set(s: str, n: int = 3) -> set:
        padded = f"__{s}__"
        return set(padded[i:i + n] for i in range(len(padded) - n + 1))

    def ngram_jaccard(a: str, b: str, n: int = 3) -> float:
        A = ngram_set(a, n)
        B = ngram_set(b, n)
        inter = len(A & B)
        union = len(A | B)
        return inter / union if union else 0

    ngram_jaccard_score = ngram_jaccard(domain, compare_domain)

    def longest_common_substring_len(a: str, b: str) -> int:
        m, n = len(a), len(b)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        max_len = 0
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if a[i - 1] == b[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                    max_len = max(max_len, dp[i][j])
        return max_len

    lcs_len = longest_common_substring_len(domain, compare_domain)
    lcs_ratio = lcs_len / max(1, max(len(domain), len(compare_domain)))

    def char_cosine_similarity(a: str, b: str) -> float:
        freq_a = {c: a.count(c) for c in set(a)}
        freq_b = {c: b.count(c) for c in set(b)}
        chars = set(freq_a) | set(freq_b)
        dot = sum(freq_a.get(c, 0) * freq_b.get(c, 0) for c in chars)
        norm_a = sum(v * v for v in freq_a.values()) ** 0.5
        norm_b = sum(v * v for v in freq_b.values()) ** 0.5
        return dot / (norm_a * norm_b) if norm_a and norm_b else 0

    char_cos = char_cosine_similarity(domain, compare_domain)

    def token_jaccard(a: str, b: str) -> float:
        tok_a = set(re.split(r'[^a-z0-9]+', a.lower()))
        tok_b = set(re.split(r'[^a-z0-9]+', b.lower()))
        inter = len(tok_a & tok_b)
        union = len(tok_a | tok_b)
        return inter / union if union else 0

    token_j = token_jaccard(domain, compare_domain)

    def split_labels(domain: str) -> dict:
        parts = domain.split('.')
        tld = parts[-1] if parts else ''
        sld = parts[-2] if len(parts) > 1 else parts[0] if parts else ''
        subdomain = '.'.join(parts[:-2]) if len(parts) > 2 else ''
        return {'subdomain': subdomain, 'sld': sld, 'tld': tld}

    A = split_labels(domain)
    B = split_labels(compare_domain)

    has_digit = any(c.isdigit() for c in domain) or any(c.isdigit() for c in compare_domain)
    has_hyphen = '-' in domain or '-' in compare_domain
    repeated_chars = bool(re.search(r'([a-z0-9])\1\1', domain) or re.search(r'([a-z0-9])\1\1', compare_domain))
    tld_diff = A['tld'] != B['tld']
    sld_one_edit_away = levenshtein(A['sld'], B['sld']) <= 1

    return {
        "dice": dice,
        "levenshtein_norm": lev_norm,
        "ngram_jaccard": ngram_jaccard_score,
        "lcs_ratio": lcs_ratio,
        "char_cosine": char_cos,
        "token_jaccard": token_j,
        "has_digit": float(has_digit),
        "has_hyphen": float(has_hyphen),
        "repeated_chars": float(repeated_chars),
        "tld_diff": float(tld_diff),
        "sld_one_edit_away": float(sld_one_edit_away),
        "domain": compare_domain  # Include for response
    }

@app.post("/check", response_model=List[dict])
async def check_domain(data: DomainCheck) -> List[dict]:
    logger.info(f"Received /check request for domain: {data.domain}, compare_to count: {len(data.compare_to)}")
    if model is None:
        logger.warning("Returning fallback response due to missing model")
        return [
            {
                "domain": compare_domain,
                "suspicious_score": 0.5
            }
            for compare_domain in data.compare_to
        ]
    
    try:
        # Extract features and create DataFrame with feature names
        feature_names = [
            "dice", "levenshtein_norm", "ngram_jaccard", "lcs_ratio", "char_cosine",
            "token_jaccard", "has_digit", "has_hyphen", "repeated_chars", "tld_diff",
            "sld_one_edit_away"
        ]
        features_data = [extract_features(data.domain, d) for d in data.compare_to]
        features = [list(f.values())[:-1] for f in features_data]  # Exclude 'domain'
        feature_df = pd.DataFrame(features, columns=feature_names)
        
        for i, f in enumerate(features):
            if len(f) != 11:
                logger.error(f"Feature vector for {data.compare_to[i]} has {len(f)} features, expected 11")
                raise ValueError(f"Feature vector has {len(f)} features, expected 11")
        
        scores = model.predict_proba(feature_df)[:, 1]
        results = [
            {
                "domain": f["domain"],
                "suspicious_score": float(score),
                **{k: f[k] for k in feature_names}  # Include all features
            }
            for f, score in zip(features_data, scores)
        ]
        logger.info(f"Returning {len(results)} similarity scores")
        return results
    except Exception as e:
        logger.error(f"Model prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

@app.get("/health")
async def health_check():
    status = "ok" if model is not None else "warning: no model loaded"
    logger.info(f"Health check: {status}")
    return {"status": status}