import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  async getReportHistory(userId: string): Promise<any[]> {
    const reports = await this.reportModel
      .find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .lean<{
        _id: string;
        domain: string;
        analysisStatus: string;
        investigatorDecision: string;
        createdAt: Date;
        updatedAt: Date;
      }[]>();

    return reports.map((r) => ({
      id: r._id,
      domain: r.domain,
      status: r.analysisStatus,
      decision: r.investigatorDecision || 'undecided',
      submittedAt: r.createdAt,
      lastUpdated: r.updatedAt,
    }));
  }

  async getReportHistoryByUser(userId: string) {
    const reports = await this.reportModel
    .find({ submittedBy: userId })
    .lean<{
        _id: string;
        domain: string;
        analysisStatus: string;
        investigatorDecision?: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>();

    if (!reports.length) {
      throw new NotFoundException('No reports found for this user.');
    }

    return reports.map((report) => ({
      id: report._id,
      domain: report.domain,
      status: report.analysisStatus,
      decision: report.investigatorDecision || 'undecided',
      submittedAt: report.createdAt,
      lastUpdated: report.updatedAt,
    }));
  }
}
