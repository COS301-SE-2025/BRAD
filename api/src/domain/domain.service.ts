import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';

@Injectable()
export class DomainService {
  constructor(
    @InjectModel('Report') private reportModel: Model<Report>,
  ) {}

  async startScrapingAndAnalysis(reportId: string): Promise<{ message: string }> {
    const report = await this.reportModel.findById(reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.analysisStatus !== 'pending') {
      throw new InternalServerErrorException('Analysis already completed or in progress');
    }

    report.analysisStatus = 'in-progress';
    await report.save();

    return { message: 'Analysis started for report ' + reportId };
  }
}
