// api/src/domain-similarity/domain-similarity.types.ts
export interface AiResult {
  domain: string;
  suspicious_score: number;
  dice?: number;
  levenshtein?: number;
  levenshteinNorm?: number;
  lcsRatio?: number;
  charCosine?: number;
  tokenJaccard?: number;
  aLen?: number;
  bLen?: number;
  hasDigit?: boolean;
  hasHyphen?: boolean;
  repeatedChars?: boolean;
}

export interface SimilarityResponse {
  domain: string;
  finalScore: number;
  lexical: any;
  pattern: any;
}