import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';
//import { Report } from '../schemas/report.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>
  ) {}

    async getOverview() {
        const totalReports = await this.reportModel.countDocuments();
        const maliciousReports = await this.reportModel.countDocuments({ investigatorDecision: 'malicious' });
        const benignReports = await this.reportModel.countDocuments({ investigatorDecision: 'benign' });
        const pending = await this.reportModel.countDocuments({ analysisStatus: 'pending' });
        const done = await this.reportModel.countDocuments({ analysisStatus: 'done' });

        return {
            totalReports,
            maliciousReports,
            benignReports,
            pending,
            done,
        };
    }

    async getHighRiskAlerts() {
        const HIGH_RISK_THRESHOLD = 0.7;

        const alerts = await this.reportModel.find({
            $or: [
                { 'analysis.riskScore': { $gte: HIGH_RISK_THRESHOLD } },
                { investigatorDecision: 'malicious' },
                { 'abuseFlags.obfuscatedScripts': true },
                { 'abuseFlags.suspiciousJS.0': { $exists: true } },
            ]
        }).select('domain analysis.riskScore investigatorDecision abuseFlags createdAt');

        return alerts;
    }

}
