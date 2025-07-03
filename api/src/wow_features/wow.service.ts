import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';

@Injectable()
export class WowService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
  ) {}

  async runInSandbox(reportId: string): Promise<any> {
    const report = await this.reportModel.findById(reportId).lean();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const simulatedNetworkActivity = [
      { protocol: 'HTTPS', destination: 'login.phishing-portal.com', port: 443 },
      { protocol: 'DNS', query: 'phishing-portal.com' },
    ];

    const simulatedProcessTree = [
      { process: 'browser.exe', action: 'open', url: `http://${report.domain}` },
      { process: 'browser.exe', action: 'load script', script: 'obfuscated.js' },
      { process: 'cmd.exe', action: 'spawned', command: 'powershell -EncodedCommand ...' },
    ];

    const sandboxResult = {
      domain: report.domain,
      sandboxRunTime: new Date().toISOString(),
      networkActivity: simulatedNetworkActivity,
      processTree: simulatedProcessTree,
      detectedMaliciousBehavior: true,
      summary: 'Suspicious scripts and external communications detected',
    };

    return sandboxResult;
  }
}
