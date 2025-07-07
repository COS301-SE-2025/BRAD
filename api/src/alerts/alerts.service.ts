import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';
import { Model } from 'mongoose';

@Injectable()
export class AlertsService {
  private subscriptions: { domain: string; email: string }[] = [];
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

  async subscribeToAlerts(domain: string, email: string) {
    if (!domain || !email) {
      throw new BadRequestException('Domain and email are required');
    }

    //Store the subscription (this can later be persisted in DB)
    this.subscriptions.push({ domain, email });

    return {
      message: `Successfully subscribed ${email} to alerts for ${domain}`,
    };
  }

  async unsubscribeFromAlerts(domain: string, email: string) {
    const initialLength = this.subscriptions.length;

    this.subscriptions = this.subscriptions.filter(
      (sub) => sub.domain !== domain || sub.email !== email,
    );

    const removed = this.subscriptions.length !== initialLength;

    if (!removed) {
      return { message: `No subscription found for ${email} on ${domain}` };
    }

    return {
      message: `Unsubscribed ${email} from alerts for ${domain}`,
    };
  }

}
