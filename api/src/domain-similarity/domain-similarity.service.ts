import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as stringSimilarity from 'string-similarity';

@Injectable()
export class DomainSimilarityService {
  constructor(@InjectModel('Report') private reportModel: Model<any>) {}

  /**
   * Compare a new domain against all submitted reports in the DB
   */
  async checkAgainstSubmittedReports(domain: string) {
    const reports = await this.reportModel.find({}, { domain: 1 }).lean();
    const knownDomains = reports.map(r => r.domain.toLowerCase());

    const cleanDomain = domain.trim().toLowerCase();

    // 🔹 Filter out self-match (so "paypal.com" doesn't always return 1.0 for itself)
    const results = knownDomains
      .filter(d => d !== cleanDomain)
      .map(d => ({
        domain: d,
        score: stringSimilarity.compareTwoStrings(cleanDomain, d),
      }));

    // 🔹 Sort by similarity (highest first)
    return results.sort((a, b) => b.score - a.score);
  }
}
