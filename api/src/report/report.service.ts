import { Injectable, NotFoundException, ForbiddenException, BadRequestException  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ForensicService } from '../services/forensic.service';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { Report } from '../schemas/report.schema';
import { Request } from 'express';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel('Report') private reportModel: Model<any>,
    private forensicService: ForensicService
  ) {}

  async submitReport(domain: string, submittedBy: string) {
    const newReport = new this.reportModel({ domain, submittedBy });
    return newReport.save();
  }

  async getReports(userId: string, role: string) {
    if (role === 'admin' || role === 'investigator') {
      // Admins and investigators can view all reports
      return this.reportModel.find().populate('submittedBy', 'username');
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
          riskScore: updateDto.riskScore,
          whois: updateDto.whois,
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

  async updateInvestigatorDecision(id: string, verdict: string) {
    if (!['malicious', 'benign'].includes(verdict))
      throw new Error('Invalid verdict');
    return this.reportModel.findByIdAndUpdate(
      id,
      { investigatorDecision: verdict },
      { new: true }
    );
  }

  async attachEvidence(reportId: string, files: Express.Multer.File[], description: string): Promise<{ message: string; evidence: any[] }> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const evidence = files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      description: description || '',
      uploadedAt: new Date(),
    }));

    report.evidence = [...(report.evidence || []), ...evidence];
    await report.save();

    return {
      message: 'Files uploaded successfully',
      evidence,
    };
  }

  //This assumes the reportModel is correctly injected and that the 
  // reports have a submittedBy field that stores the user ID.
  async getReportsByUser(userId: string): Promise<any[]> {
    const reports = await this.reportModel.find({ submittedBy: userId }).exec();
    return reports;
  }

  async getReportById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid report ID');
    }

    const report = await this.reportModel.findById(id).populate('user', '-password');
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }
}
