import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

    async getReportTimeline() {
        const timeline = await this.reportModel.find({})
            .sort({ createdAt: -1 })
            .select('domain createdAt analysisStatus analyzed updatedAt')
            .lean<{ domain: string; createdAt: Date; updatedAt: Date; analyzed: boolean; analysisStatus: string }[]>();

        return timeline.map((report) => ({
            domain: report.domain,
            submittedAt: report.createdAt,
            lastUpdated: report.updatedAt,
            analyzed: report.analyzed,
            status: report.analysisStatus,
        }));
    }

    async getInvestigatorReports(userId: string) {
    
        const reports = await this.reportModel.find({
            analysisStatus: { $in: ['pending', 'in-progress'] }
        })
        .sort({ createdAt: -1 })
        .select('domain analysisStatus createdAt investigatorDecision')
        .lean<{ _id: string; domain: Date; createdAt: Date; investigatorDecision?: 'malicious' | 'benign' | null; analysisStatus: string }[]>();

        return reports.map((report) => ({
            id: report._id,
            domain: report.domain,
            status: report.analysisStatus,
            submittedAt: report.createdAt,
            decision: report.investigatorDecision || 'undecided',
        }));
    }

    async getOpenCasesCount(): Promise<number> {
        return this.reportModel.countDocuments({ status: 'open' }).exec();
    }

    async getClosedCasesCount(): Promise<number> {
        return this.reportModel.countDocuments({ status: 'closed' }).exec();
    }

    async getInvestigatorEmail(userId: string): Promise<{ email: string }> {
        const user = await this.userModel.findById(userId).select('email role');
        if (!user || user.role !== 'investigator') {
        throw new NotFoundException('Investigator not found or unauthorized');
        }

        return { email: user.email };
    }

}
