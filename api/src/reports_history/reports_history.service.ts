import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createObjectCsvStringifier } from 'csv-writer';
import PDFDocument from 'pdfkit';
//import * as PDFDocument from 'pdfkit';
//import { Readable } from 'stream';
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

  async exportReport(reportId: string, format: 'pdf' | 'csv'): Promise<Buffer> {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) throw new NotFoundException();

    if (format === 'csv') {
      const csv = createObjectCsvStringifier({
        header: Object.keys(report).map((key) => ({ id: key, title: key })),
      });

      const header = csv.getHeaderString();
      const body = csv.stringifyRecords([report]);
      return Buffer.from(header + body);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {});

      doc.fontSize(14).text('Report Details', { underline: true });
      doc.moveDown();

      Object.entries(report).forEach(([key, value]) => {
        doc.fontSize(12).text(`${key}: ${JSON.stringify(value)}`);
      });

      doc.end();

      return new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
      });
    }

    throw new Error('Unsupported format');
  }

  async getDomainAbuseHistory(domain: string): Promise<any[]> {
    return this.reportModel
      .find({ domain })
      .select('domain createdAt updatedAt analysisStatus investigatorDecision')
      .sort({ createdAt: -1 })
      .lean();
  }

}
