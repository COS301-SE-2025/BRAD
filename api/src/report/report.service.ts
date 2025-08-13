import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForensicService } from '../services/forensic.service';
import { QueueService } from '../queue/queue.service'; 
import { UpdateAnalysisDto } from './dto/update-analysis.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel('Report') private reportModel: Model<any>,
    private forensicService: ForensicService,
    private readonly queueService: QueueService
  ) {}

  async submitReport(domain: string, submittedBy: string, evidenceFiles?: string[]) {
    const newReport = new this.reportModel({
      domain,
      submittedBy,
      evidence: evidenceFiles || [],
    });

    const savedReport = await newReport.save();

    // Call FastAPI queue service via HTTP
    try {
      await this.queueService.queueToFastAPI(savedReport.domain, savedReport._id.toString());
      console.log(`[API] Queued report ${domain} (${savedReport._id}) for bot analysis.`);
    } catch (err) {
      console.error(`[API] Failed to queue report ${domain}:`, err.message);
      // Optional: Decide if you want to delete or flag the report
    }

    return savedReport;
  }



  async getReports(userId: string, role: string) {
    if (role === 'admin' || role === 'investigator') {
      // Admins and investigators can view all reports
      return this.reportModel.find().populate('submittedBy', 'username').populate('reviewedBy', 'username');
    }
  
    if (role === 'general') {
      // General users can only see their own reports
      return this.reportModel
        .find({ submittedBy: userId })
        .populate('submittedBy', 'username');
    }
  
    // In case the role is unknown or missing
    throw new ForbiddenException('Role not permitted to view reports');
  }
  
    async getReportsByUsername(username: string, role: string): Promise<any[]> {
    if (role === 'admin' || role === 'investigator') {
      return this.reportModel.find().populate('submittedBy', 'username');
    }
  

  
    throw new ForbiddenException('Role not permitted to view reports');
  }

  async analyzeReport(id: string) {
    const report = await this.reportModel.findById(id);
    if (!report) throw new NotFoundException('Report not found');
    return this.forensicService.performAnalysis(report); // can be sync or async
  }

  async getPendingReport() {
    const pending = await this.reportModel.find({ analyzed: false }).limit(1);
    return pending[0] ?? null;
  }

  async updateAnalysis(id: string, updateDto: UpdateAnalysisDto): Promise<Report> {
  const updated = await this.reportModel.findByIdAndUpdate(
    id,
    {
      $set: {
        analysis: updateDto.analysis,
        scrapingInfo: updateDto.scrapingInfo,
        abuseFlags: updateDto.abuseFlags,
        analyzed: true,
        analysisStatus: updateDto.analysisStatus || 'done',
        updatedAt: new Date(),
      },
    },
    { new: true },
  );

  

  if (!updated) {
    throw new NotFoundException(`Report with id ${id} not found`);
  }

  return updated;
  }

  
async updateDecisionAndReviewer(id: string, verdict: string, reviewedById: string) {
  if (!['malicious', 'benign'].includes(verdict)) {
    throw new Error('Invalid verdict');
  }

  const updated = await this.reportModel.findByIdAndUpdate(
    id,
    { investigatorDecision: verdict, reviewedBy: reviewedById },
    { new: true }
  );

  if (!updated) {
    throw new NotFoundException(`Report with id ${id} not found`);
  }

  return updated;
}
async claimReport(id: string, reviewedById: string) {
  const report = await this.reportModel.findById(id);
  if (!report) throw new NotFoundException('Report not found');

  const updated = await this.reportModel.findByIdAndUpdate(
    id,
    { analysisStatus: 'in-progress', reviewedBy: reviewedById },
    { new: true }
  );

  return updated;
}


async releaseReport(reportId: string, investigatorId: string) {
  const report = await this.reportModel.findOneAndUpdate(
    { _id: reportId, analysisStatus: 'in-progress', reviewedBy: investigatorId },
    { analysisStatus: 'pending', reviewedBy: null },
    { new: true }
  );
  
  if (!report) {
    throw new Error('Cannot release report: either not claimed by you or not in-progress');
  }

  return report;
}
}