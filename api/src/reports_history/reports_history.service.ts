import { Injectable } from '@nestjs/common';
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
}
