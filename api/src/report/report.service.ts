import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ForensicService } from '../services/forensic.service';
import { QueueService } from '../queue/queue.service';
import { UpdateAnalysisDto, AnalysisStatusUnified } from './dto/update-analysis.dto';
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

        for (const inv of investigators) {
          const mailOptions = {
            to: inv.email,
            from: this.configService.get<string>('EMAIL_USER'),
            subject: '🚨 New Report Submitted for Analysis',
            text: `Hello ${inv.firstname || inv.username},

              A new suspicious domain has been reported:

              Submission Detail
              -----------------
              Report ID: ${savedReport._id}
              Submitted At: ${savedReport.createdAt.toLocaleString()}

              Please log in to review the report:
              [Login in BRAD Dashboard] https://capstone-brad.dns.net.za/login

              Thank you,
              BRAD Notification Service
              (Automated Email – do not reply directly)
`
          };

          await transporter.sendMail(mailOptions);
        }

        console.log(`[EMAIL] Notifications sent to ${investigators.length} investigators.`);
      }
    } catch (emailErr) {
      console.error('[EMAIL] Failed to notify investigators:', emailErr.message);
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
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid report id');
  }

  // Normalize status (default to Done only if not provided)
  const status: AnalysisStatusUnified =
    (updateDto.analysisStatus as AnalysisStatusUnified) ?? AnalysisStatusUnified.Done;

  const explicitStatusProvided =
    Object.prototype.hasOwnProperty.call(updateDto, 'analysisStatus') &&
    updateDto.analysisStatus !== undefined;

  // Guard: you cannot mark Done with no analysis payload at all
  const hasAnyPayload =
    updateDto.analysis !== undefined ||
    updateDto.scrapingInfo !== undefined ||
    updateDto.abuseFlags !== undefined;

  if (status === AnalysisStatusUnified.Done && !hasAnyPayload) {
    throw new BadRequestException('Cannot mark analysis DONE without any analysis data.');
  }

  // Compute analyzed flag:
  //  - DONE  -> true
  //  - ERROR -> false
  //  - Any other status:
  //      * if caller explicitly changed status -> false
  //      * otherwise leave as-is (do not set)
  let analyzed: boolean | undefined;
  if (status === AnalysisStatusUnified.Done) {
    analyzed = true;
  } else if (status === AnalysisStatusUnified.Error) {
    analyzed = false;
  } else if (explicitStatusProvided) {
    analyzed = false;
  } // else: undefined => don't touch current value

  // Build $set only with provided fields (avoid null/undefined clobbering)
  const $set: Record<string, unknown> = { analysisStatus: status };
  if (typeof analyzed === 'boolean') $set.analyzed = analyzed;
  if (updateDto.analysis !== undefined) $set.analysis = updateDto.analysis;
  if (updateDto.scrapingInfo !== undefined) $set.scrapingInfo = updateDto.scrapingInfo;
  if (updateDto.abuseFlags !== undefined) $set.abuseFlags = updateDto.abuseFlags;

  // Allow callers to clear fields by sending null
  const $unset: Record<string, ''> = {};
  if (updateDto.analysis === null) $unset.analysis = '';
  if (updateDto.scrapingInfo === null) $unset.scrapingInfo = '';
  if (updateDto.abuseFlags === null) $unset.abuseFlags = '';

  const update: any = {
    $set,
    $currentDate: { updatedAt: true }, // atomic server-side timestamp
  };
  if (Object.keys($unset).length) update.$unset = $unset;

  const updated = await this.reportModel
    .findByIdAndUpdate(
      id,
      update,
      {
        new: true,
        runValidators: true,
        context: 'query', // ensures validators that rely on this.getUpdate() behave
      },
    )
    .exec();

  if (!updated) {
    throw new NotFoundException(`Report ${id} not found`);
  }

  return updated;
}


  async updateDecisionAndReviewer(id: string, verdict: string, reviewedById: string) {
  if (!['malicious', 'benign'].includes(verdict)) {
    throw new Error('Invalid verdict');
  }

  const updated = await this.reportModel.findByIdAndUpdate(
    { _id: id, reviewedBy: reviewedById, analysisStatus: 'in-progress' },
    { investigatorDecision: verdict, reviewedBy: reviewedById, analysisStatus: 'done' },
    { new: true }
  ).populate('submittedBy', 'firstname username email');

  if (!updated) {
    throw new NotFoundException(`Report with id ${id} not found`);
  }

  try {
    if (updated.submittedBy?.email) {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: this.configService.get<string>('EMAIL_USER'),
          pass: this.configService.get<string>('EMAIL_PASS'),
        },
      });

      const mailOptions = {
        to: updated.submittedBy.email,
        from: this.configService.get<string>('EMAIL_USER'),
        subject: `📢 Your Report Has Been Analysed`,
        text: `Hello ${updated.submittedBy.firstname || updated.submittedBy.username},

        Your submitted report has been analysed by an investigator.

        Submission Detail
        -----------------
        Domain: ${updated.domain} 
        Report ID: ${updated._id}
        Submitted At: ${updated.createdAt.toLocaleString()}
        Verdict: ${verdict.toUpperCase()}

        You can log in to the BRAD Dashboard to review the full analysis:
        [Login in BRAD Dashboard] https://capstone-brad.dns.net.za/login

        Thank you,
        BRAD Notification Service
        (Automated Email – do not reply directly)`
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Notified reporter (${updated.submittedBy.email}) of verdict.`);
    }
  } catch (err) {
    console.error('[EMAIL] Failed to notify reporter:', err.message);
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

async addScreenshot(id: string, relPath: string) {
  return this.reportModel.findByIdAndUpdate(
    id,
    { $push: { screenshots: relPath } },
    { new: true }
  );
}
}