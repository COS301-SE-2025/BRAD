import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForensicService } from '../services/forensic.service';
import { QueueService } from '../queue/queue.service';
import { UpdateAnalysisDto } from './dto/update-analysis.dto';
import { User } from '../schemas/user.schema';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel('Report') private reportModel: Model<any>,
    @InjectModel(User.name) private userModel: Model<User>,
    private forensicService: ForensicService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
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
    }

    // 🔹 Notify all investigators
    try {
      const investigators = await this.userModel.find({ role: 'investigator' });
      if (investigators.length > 0) {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: this.configService.get<string>('EMAIL_USER'),
            pass: this.configService.get<string>('EMAIL_PASS'),
          },
        });

        const mailOptions = {
          from: this.configService.get<string>('EMAIL_USER'),
          to: investigators.map((inv) => inv.email), // all investigators
          subject: '🚨 New Report Submitted for Analysis',
          text: `A new suspicious domain has been reported \nPlease log in to the B.R.A.D dashboard to review it:\n https://capstone-brad.dns.net.za/login`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Notification sent to ${investigators.length} investigators`);
      }
    } catch (err) {
      console.error('[EMAIL] Failed to send investigator notification:', err.message);
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
    return this.forensicService.performAnalysis(report);
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
    {_id:id,reviewedBy: reviewedById, analysisStatus: 'in-progress'},
    { investigatorDecision: verdict, reviewedBy: reviewedById, analysisStatus: 'done' },
    { new: true }
  );

    if (!updated) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    return updated;
  }

  async claimReport(id: string, reviewedById: string) {
    const updated = await this.reportModel.findOneAndUpdate(
      {
        _id: id,
        investigatorDecision: null,
        reviewedBy: null,
        analysisStatus: 'pending'

      },
      {
        reviewedBy: reviewedById,
        analysisStatus: 'in-progress'
      },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundException(
        'Report not found or cannot be claimed (status not pending or already decided)'
      );
    }

    return updated;
  }
  

async releaseReport(reportId: string, investigatorId: string) {
  const report = await this.reportModel.findOneAndUpdate(
    { _id: reportId, reviewedBy: investigatorId, investigatorDecision: null, analysisStatus: 'in-progress' },
    { reviewedBy: null, investigatorDecision: null, analysisStatus: 'pending' },
    { new: true }
  );

    if (!report) {
      throw new Error('Cannot release report: either not claimed by you or not in-progress');
    }

    return report;
  }
}