import pandas as pd
import numpy as np
import random
import string
import re
from collections import Counter

def compute_features(a: str, b: str):
    def normalize_domain(raw: str) -> str:
        s = raw.strip().lower()
        s = re.sub(r'^https?://', '', s)
        s = re.sub(r'/.*$', '', s)
        return s

    a = normalize_domain(a)
    b = normalize_domain(b)

    def dice(a, b):
        a_bigrams = set([a[i:i+2] for i in range(len(a)-1)])
        b_bigrams = set([b[i:i+2] for i in range(len(b)-1)])
        inter = len(a_bigrams & b_bigrams)
        total = len(a_bigrams) + len(b_bigrams)
        return 2 * inter / total if total > 0 else 0

    def levenshtein_distance(s1, s2):
        m, n = len(s1), len(s2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                cost = 0 if s1[i - 1] == s2[j - 1] else 1
                dp[i][j] = min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                )
        return dp[m][n]

    lev = levenshtein_distance(a, b)
    levenshtein_norm = 1 - lev / max(1, max(len(a), len(b)))

    def ngram_set(s: str, n: int = 3) -> set:
        padded = f"__{s}__"
        return set(padded[i:i + n] for i in range(len(padded) - n + 1))

    def ngram_jaccard(a: str, b: str, n: int = 3) -> float:
        A = ngram_set(a, n)
        B = ngram_set(b, n)
        inter = len(A & B)
        union = len(A | B)
        return inter / union if union else 0

    def lcs_ratio(x, y):
        m, n = len(x), len(y)
        L = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if x[i - 1] == y[j - 1]:
                    L[i][j] = L[i - 1][j - 1] + 1
                else:
                    L[i][j] = max(L[i - 1][j], L[i][j - 1])
        return L[m][n] / max(1, max(m, n))

    def char_cosine(a, b):
        ca = Counter(a)
        cb = Counter(b)
        chars = set(ca) | set(cb)
        dot = sum(ca[c] * cb.get(c, 0) for c in chars)
        magA = sum(v * v for v in ca.values()) ** 0.5
        magB = sum(v * v for v in cb.values()) ** 0.5
        return dot / (magA * magB) if magA * magB > 0 else 0

    def token_jaccard(a, b):
        tokA = set(re.split(r'[^a-z0-9]+', a.lower()))
        tokB = set(re.split(r'[^a-z0-9]+', b.lower()))
        inter = len(tokA & tokB)
        union = len(tokA | tokB)
        return inter / union if union > 0 else 0

    def split_labels(domain: str) -> dict:
        parts = domain.split('.')
        tld = parts[-1] if parts else ''
        sld = parts[-2] if len(parts) > 1 else parts[0] if parts else ''
        subdomain = '.'.join(parts[:-2]) if len(parts) > 2 else ''
        return {'subdomain': subdomain, 'sld': sld, 'tld': tld}

    A = split_labels(a)
    B = split_labels(b)

    has_digit = bool(re.search(r'\d', a + b))
    has_hyphen = '-' in a or '-' in b
    repeated_chars = bool(re.search(r'(.)\1\1', a + b))
    tld_diff = A['tld'] != B['tld']
    sld_one_edit_away = levenshtein_distance(A['sld'], B['sld']) <= 1

    features = {
        "dice": dice(a, b),
        "levenshtein_norm": levenshtein_norm,
        "ngram_jaccard": ngram_jaccard(a, b),
        "lcs_ratio": lcs_ratio(a, b),
        "char_cosine": char_cosine(a, b),
        "token_jaccard": token_jaccard(a, b),
        "has_digit": float(has_digit),
        "has_hyphen": float(has_hyphen),
        "repeated_chars": float(repeated_chars),
        "tld_diff": float(tld_diff),
        "sld_one_edit_away": float(sld_one_edit_away),
    }
    return features

legit_domains = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com', 'x.com', 'reddit.com', 'whatsapp.com', 'bing.com', 'wikipedia.org', 'yahoo.com', 'tiktok.com', 'amazon.com', 'baidu.com', 'linkedin.com', 'temu.com', 'naver.com', 'netflix.com', 'live.com', 'pinterest.com']

def generate_typo(domain):
    methods = ['omission', 'addition', 'transposition', 'substitution', 'repeat', 'leet']
    method = random.choice(methods)
    s = domain[:-4]  # assume .com
    tld = domain[-4:]
    typo = s
    if method == 'omission' and len(s) > 1:
        pos = random.randint(0, len(s)-1)
        typo = s[:pos] + s[pos+1:]
    elif method == 'addition':
        char = random.choice(string.ascii_lowercase + '0123456789')
        pos = random.randint(0, len(s))
        typo = s[:pos] + char + s[pos:]
    elif method == 'transposition' and len(s) > 1:
        pos = random.randint(0, len(s)-2)
        typo = s[:pos] + s[pos+1] + s[pos] + s[pos+2:]
    elif method == 'substitution':
        substitutes = {'a':'4', 'e':'3', 'i':'1', 'o':'0', 's':'5', 't':'7'}
        pos = random.randint(0, len(s)-1)
        char = s[pos]
        new_char = substitutes.get(char, random.choice(string.ascii_lowercase))
        typo = s[:pos] + new_char + s[pos+1:]
    elif method == 'repeat':
        pos = random.randint(0, len(s)-1)
        typo = s[:pos] + s[pos] + s[pos:]
    elif method == 'leet':
        leet_map = {'a':'@', 'e':'3', 'i':'!', 'o':'0', 's':'$', 't':'+'}
        typo = ''.join(leet_map.get(c, c) for c in s)
    return typo + tld

random.seed(42)  # Reproducible

positive_pairs = []
for legit in legit_domains:
    for _ in range(5):
        typo = generate_typo(legit)
        while typo == legit:
            typo = generate_typo(legit)
        positive_pairs.append((legit, typo, 1))

negative_pairs = []
for _ in range(len(positive_pairs)):
    d1 = random.choice(legit_domains)
    d2 = random.choice(legit_domains)
    while d1 == d2:
        d2 = random.choice(legit_domains)
    negative_pairs.append((d1, d2, 0))

pairs = positive_pairs + negative_pairs
random.shuffle(pairs)

data = []
for a, b, label in pairs:
    feats = compute_features(a, b)
    feats['label'] = label
    data.append(feats)

df = pd.DataFrame(data)
df.to_csv('domain_features.csv', index=False)
print("Generated domain_features.csv with", df.shape[0], "rows.")