from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
import uvicorn

# Load trained model
model = joblib.load("domain_model.pkl")

app = FastAPI(title="Domain Similarity AI")

class DomainRequest(BaseModel):
    domain: str
    compare_to: list[str] = []

@app.post("/check")
async def check_domain(req: DomainRequest):
    results = []
    for other in req.compare_to:
        # Compute lexical/pattern features same way as training
        # For simplicity we assume precomputed features exist
        # (Could call a separate feature generator function)
        features = compute_features(req.domain, other)
        score = model.predict_proba(pd.DataFrame([features]))[0][1]  # probability suspicious
        results.append({
            "domain": other,
            "suspicious_score": round(score, 4),
            **features
        })
    # Sort descending by suspicious_score
    results.sort(key=lambda x: x["suspicious_score"], reverse=True)
    return results

# ----------------------- Feature generator -----------------------
def compute_features(a: str, b: str):
    # replicate lexical + pattern features from your NestJS service
    import re
    from collections import Counter

    # Dice similarity
    def dice(a,b):
        a_bigrams = set([a[i:i+2] for i in range(len(a)-1)])
        b_bigrams = set([b[i:i+2] for i in range(len(b)-1)])
        inter = len(a_bigrams & b_bigrams)
        total = len(a_bigrams)+len(b_bigrams)
        return 2*inter/total if total>0 else 0

    # Levenshtein
    import Levenshtein
    lev = Levenshtein.distance(a,b)
    levNorm = 1 - lev/max(1, max(len(a), len(b)))

    # LCS ratio
    def lcs_ratio(x,y):
        m,n=len(x),len(y)
        L=[[0]*(n+1) for _ in range(m+1)]
        for i in range(m):
            for j in range(n):
                if x[i]==y[j]: L[i+1][j+1]=L[i][j]+1
                else: L[i+1][j+1]=max(L[i][j+1], L[i+1][j])
        return L[m][n]/max(1,m,n)
    
    # Char cosine similarity
    def char_cos(a,b):
        ca = Counter(a); cb=Counter(b)
        chars = set(ca.keys())|set(cb.keys())
        dot=sum(ca[c]*cb.get(c,0) for c in chars)
        magA=sum(v*v for v in ca.values())**0.5
        magB=sum(v*v for v in cb.values())**0.5
        return dot/(magA*magB) if magA*magB>0 else 0

    # Token Jaccard
    def token_jaccard(a,b):
        tokA=set(re.split(r"[\.-]", a))
        tokB=set(re.split(r"[\.-]", b))
        inter=len(tokA & tokB)
        union=len(tokA|tokB)
        return inter/union if union>0 else 0

    features = {
        "dice": dice(a,b),
        "levenshtein": lev,
        "levenshteinNorm": levNorm,
        "lcsRatio": lcs_ratio(a,b),
        "charCosine": char_cos(a,b),
        "tokenJaccard": token_jaccard(a,b),
        "aLen": len(a),
        "bLen": len(b),
        "hasDigit": bool(re.search(r"\d", a+b)),
        "hasHyphen": "-" in a or "-" in b,
        "repeatedChars": bool(re.search(r"(.)\1\1", a+b)),
    }
    return features

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
