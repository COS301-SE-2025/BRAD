// src/services/forensic.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ForensicService {
  performAnalysis(report: any) {
    // Replace with your real logic
    return {
      domain: report.domain,
      score: Math.random().toFixed(2),
      verdict: Math.random() > 0.5 ? 'benign' : 'malicious',
    };
  }
}
