import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as stringSimilarity from 'string-similarity';
import * as punycode from 'punycode/';

// Optional: if you don't want punycode dependency you can drop its use.
// (Node historically included `punycode`—using the npm package is safer.)

@Injectable()
export class DomainSimilarityService {
  constructor(@InjectModel('Report') private reportModel: Model<any>) {}

  /**
   * Public entry - compares `domain` against known domains and returns
   * sorted results with feature breakdowns and a combined finalScore in [0,1].
   */
  async checkAgainstSubmittedReports(domain: string) {
    const reports = await this.reportModel.find({}, { domain: 1 }).lean();
    const knownDomains = reports
      .map((r) => (r.domain || '').toString().trim().toLowerCase())
      .filter(Boolean);

    const cleanDomain = this.normalizeDomain(domain);

    const results = knownDomains
      .filter((d) => d !== cleanDomain) // filter out self
      .map((d) => {
        const lexical = this.lexicalSimilarity(cleanDomain, d);
        const pattern = this.patternAnalysis(cleanDomain, d);
        const finalScore = this.combineScores(lexical, pattern);

        return {
          domain: d,
          finalScore,
          lexical,
          pattern,
        };
      });

    // sort highest score first
    return results.sort((a, b) => b.finalScore - a.finalScore);
  }

  /* ----------------------------- Normalization --------------------------- */

  private normalizeDomain(raw: string) {
    const s = raw.trim().toLowerCase();
    // convert unicode to punycode so comparisons are consistent
    // eg: cafésite.com -> xn--caf-something
    try {
      return punycode.toASCII(s);
    } catch (e) {
      return s;
    }
  }

  private splitLabels(domain: string) {
    // basic split — doesn't consult PSL (public suffix list). For many cases this suffices.
    const parts = domain.split('.').filter(Boolean);
    const tld = parts.length > 0 ? parts[parts.length - 1] : '';
    const sld = parts.length > 1 ? parts[parts.length - 2] : parts[0] || '';
    const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
    return { labels: parts, subdomain, sld, tld };
  }

  /* --------------------------- Lexical metrics ---------------------------- */

  private lexicalSimilarity(a: string, b: string) {
    // high-level string-similarity (Dice / Sorensen–Dice)
    const dice = stringSimilarity.compareTwoStrings(a, b); // 0..1

    // Levenshtein distance -> normalized similarity
    const lev = this.levenshtein(a, b);
    const levNorm = 1 - lev / Math.max(1, Math.max(a.length, b.length)); // 0..1 (higher = more similar)

    // ngram (3-gram) Jaccard
    const ngramJaccard = this.ngramJaccard(a, b, 3);

    // longest common substring ratio (to max len)
    const lcsLen = this.longestCommonSubstringLen(a, b);
    const lcsRatio = lcsLen / Math.max(1, Math.max(a.length, b.length));

    // char frequency cosine similarity
    const charCos = this.charCosineSimilarity(a, b);

    // token jaccard (split on non-alphanum)
    const tokenJ = this.tokenJaccard(a, b);

    return {
      dice, // from string-similarity
      levenshtein: lev,
      levenshteinNorm: this.round(levNorm, 4),
      ngramJaccard: this.round(ngramJaccard, 4),
      lcsRatio: this.round(lcsRatio, 4),
      charCosine: this.round(charCos, 4),
      tokenJaccard: this.round(tokenJ, 4),
      aLen: a.length,
      bLen: b.length,
    };
  }

  /* --------------------------- Pattern analysis -------------------------- */

  private patternAnalysis(a: string, b: string) {
    // Flags and heuristics that indicate typosquatting / obfuscation patterns
    const A = this.splitLabels(a);
    const B = this.splitLabels(b);

    const flags = {
      hasDigit: /\d/.test(a) || /\d/.test(b),
      hasHyphen: a.includes('-') || b.includes('-'),
      repeatedChars: /([a-z0-9])\1\1/.test(a) || /([a-z0-9])\1\1/.test(b), // triple repeat
      subdomainSuspicious:
        (!!A.subdomain && A.subdomain.length > 0 && A.subdomain === B.sld) ||
        false,
      tldDiff: A.tld !== B.tld,
      sldTransposition: this.isTransposition(A.sld, B.sld),
      leetMatch: this.isLeetMatch(A.sld, B.sld),
      sldOneEditAway:
        this.levenshtein(A.sld, B.sld) <= 1 || this.levenshtein(A.sld, B.sld) === 0,
      hyphenRemovedMatch:
        A.sld.replace(/-/g, '') === B.sld.replace(/-/g, ''),
      containsKnownAsSubstring:
        A.sld.includes(B.sld) || B.sld.includes(A.sld),
    };

    return flags;
  }

  /* ------------------------- Combine & score ----------------------------- */

  private combineScores(lexical: any, pattern: any) {
    // Base weighted aggregation of lexical signals
    // Weights chosen as a reasonable starting point; tune with data.
    const weights = {
      dice: 0.30,
      levenshteinNorm: 0.20,
      ngramJaccard: 0.18,
      lcsRatio: 0.17,
      charCosine: 0.10,
      tokenJaccard: 0.05,
    };

    const base =
      (lexical.dice * weights.dice || 0) +
      (lexical.levenshteinNorm * weights.levenshteinNorm || 0) +
      (lexical.ngramJaccard * weights.ngramJaccard || 0) +
      (lexical.lcsRatio * weights.lcsRatio || 0) +
      (lexical.charCosine * weights.charCosine || 0) +
      (lexical.tokenJaccard * weights.tokenJaccard || 0);

    // small heuristic bonuses when suspicious patterns are present
    let bonus = 0;
    if (pattern.leetMatch) bonus += 0.06;
    if (pattern.hasDigit) bonus += 0.04;
    if (pattern.hasHyphen) bonus += 0.02;
    if (pattern.tldDiff) bonus += 0.03;
    if (pattern.sldTransposition) bonus += 0.04;
    if (pattern.sldOneEditAway) bonus += 0.05;
    if (pattern.hyphenRemovedMatch) bonus += 0.05;
    if (pattern.repeatedChars) bonus += 0.03;

    const raw = base + bonus;
    // clamp between 0 and 1
    const finalScore = Math.max(0, Math.min(1, raw));

    return this.round(finalScore, 4);
  }

  /* ---------------------- Helper algorithmic funcs ---------------------- */

  private levenshtein(a: string, b: string) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    // use two-row DP for memory
    let prev = new Array(n + 1);
    let cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(
          prev[j] + 1, // deletion
          cur[j - 1] + 1, // insertion
          prev[j - 1] + cost // substitution
        );
      }
      // swap
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }

  private ngramSet(s: string, n = 3) {
    const padded = `__${s}__`;
    const set = new Set<string>();
    for (let i = 0; i <= padded.length - n; i++) {
      set.add(padded.slice(i, i + n));
    }
    return set;
  }

  private ngramJaccard(a: string, b: string, n = 3) {
    const A = this.ngramSet(a, n);
    const B = this.ngramSet(b, n);
    let inter = 0;
    A.forEach((x) => { if (B.has(x)) inter++; });
    const union = A.size + B.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  private longestCommonSubstringLen(a: string, b: string) {
    const m = a.length, n = b.length;
    if (m === 0 || n === 0) return 0;
    // simple DP O(m*n) time, O(min(m,n)) memory is possible but we keep clarity
    const dp: number[] = new Array(n + 1).fill(0);
    let max = 0;
    for (let i = 1; i <= m; i++) {
      for (let j = n; j >= 1; j--) {
        if (a[i - 1] === b[j - 1]) {
          dp[j] = dp[j - 1] + 1;
          if (dp[j] > max) max = dp[j];
        } else {
          dp[j] = 0;
        }
      }
    }
    return max;
  }

  private charCosineSimilarity(a: string, b: string) {
    const freqA: Record<string, number> = {};
    const freqB: Record<string, number> = {};
    for (const ch of a) freqA[ch] = (freqA[ch] || 0) + 1;
    for (const ch of b) freqB[ch] = (freqB[ch] || 0) + 1;
    const chars = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    chars.forEach((c) => {
      const va = freqA[c] || 0;
      const vb = freqB[c] || 0;
      dot += va * vb;
      normA += va * va;
      normB += vb * vb;
    });
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private tokenJaccard(a: string, b: string) {
    const tokA = new Set(a.split(/[^a-z0-9]+/).filter(Boolean));
    const tokB = new Set(b.split(/[^a-z0-9]+/).filter(Boolean));
    let inter = 0;
    tokA.forEach((t) => { if (tokB.has(t)) inter++; });
    const union = tokA.size + tokB.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  private isTransposition(a: string, b: string) {
    // returns true if a and b have same length and differ by swapping two adjacent chars
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    let diffs: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffs.push(i);
      if (diffs.length > 2) return false;
    }
    if (diffs.length !== 2) return false;
    const [i, j] = diffs;
    return i + 1 === j && a[i] === b[j] && a[j] === b[i];
  }

  private isLeetMatch(a: string, b: string) {
    // basic leet/number -> letter mapping
    const map: Record<string, string> = {
      '0': 'o',
      '1': 'l',
      '3': 'e',
      '4': 'a',
      '5': 's',
      '7': 't',
      '$': 's',
      '@': 'a',
      '|': 'l'
    };
    const normalizeLeet = (s: string) =>
      s.replace(/[^a-z0-9]/g, '').split('').map(ch => map[ch] || ch).join('');

    const na = normalizeLeet(a);
    const nb = normalizeLeet(b);
    // if after replacing numbers with letters they become identical or within 1 edit
    if (na === nb) return true;
    return this.levenshtein(na, nb) <= 1;
  }

  private round(v: number, d = 3) {
    const p = Math.pow(10, d);
    return Math.round(v * p) / p;
  }
}
