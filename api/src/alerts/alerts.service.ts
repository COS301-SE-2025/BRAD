import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';
import { Model } from 'mongoose';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async getAllAlerts() {
    const riskyReports = await this.reportModel.find({
    $or: [
        { riskScore: { $gte: 0.7 } },
        { 'analysis.malwareDetected': true },
        { analysisStatus: 'done', investigatorDecision: 'malicious' },
        { 'abuseFlags.obfuscatedScripts': true },
        { 'abuseFlags.redirectChain.0': { $exists: true } },
        { 'abuseFlags.suspiciousInlineEvents.0': { $exists: true } },
    ],
    })
    .sort({ updatedAt: -1 })
    .lean<{
        _id: string;
        domain: string;
        riskScore?: number;
        investigatorDecision?: 'malicious' | 'benign' | null;
        updatedAt?: Date;
        createdAt?: Date;
    }[]>();


    return riskyReports.map((report) => ({
      id: report._id,
      domain: report.domain,
      message: `Potential threat detected on ${report.domain}`,
      level: this.getRiskLevel(report.riskScore),
      source: report.investigatorDecision || 'system',
      timestamp: report.updatedAt || report.createdAt,
    }));
  }

  private getRiskLevel(score?: number): 'low' | 'medium' | 'high' {
    if (score === undefined || score < 0.4) return 'low';
    if (score < 0.7) return 'medium';
    return 'high';
  }
}
