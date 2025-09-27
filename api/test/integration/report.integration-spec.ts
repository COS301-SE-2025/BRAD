import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../../src/report/report.service';
import { ForensicService } from '../../src/services/forensic.service';
import { QueueService } from '../../src/queue/queue.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { connectInMemoryDB, disconnectInMemoryDB, mongoServer } from '../setup-test-db';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { NotFoundException } from '@nestjs/common';
import { AnalysisStatusUnified } from '../../src/report/dto/update-analysis.dto'; // Import the enum

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

describe('ReportService (Integration)', () => {
  let service: ReportService;
  let userModel: Model<User>;
  let reportModel: Model<any>;

  beforeAll(async () => {
    await connectInMemoryDB();

    const ReportSchema = new Schema(
      {
        domain: String,
        submittedBy: String,
        evidence: [String],
        analyzed: Boolean,
        analysisStatus: String,
        reviewedBy: String,
        investigatorDecision: String,
        analysis: Object,
        scrapingInfo: Object,
        abuseFlags: [String],
      },
      { timestamps: true },
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ EMAIL_USER: 'test@example.com', EMAIL_PASS: 'testpass' })],
        }),
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: mongoServer.getUri(),
          }),
        }),
        MongooseModule.forFeature([
          { name: 'Report', schema: ReportSchema },
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [
        ReportService,
        {
          provide: QueueService,
          useValue: { queueToFastAPI: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: ForensicService,
          useValue: { performAnalysis: jest.fn().mockResolvedValue({ result: 'safe' }) },
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => (key === 'EMAIL_USER' ? 'test@example.com' : 'testpass') },
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    reportModel = module.get<Model<any>>(getModelToken('Report'));
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await reportModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectInMemoryDB();
  });

  it('should submit a report and notify investigators', async () => {
    const spy = jest.spyOn(nodemailer, 'createTransport');

    const investigator = await new userModel({
      firstname: 'Investigator',
      lastname: 'One',
      username: 'inv1',
      email: 'inv1@example.com',
      password: 'password',
      role: 'investigator',
    }).save();

    const report = await service.submitReport('malicious.com', 'user123', ['evidence1.txt']);

    expect(report).toHaveProperty('_id');
    expect(report.domain).toBe('malicious.com');
    expect(spy).toHaveBeenCalled();
    const transporterInstance = spy.mock.results[0].value;
    expect(transporterInstance.sendMail).toHaveBeenCalled();
  });

  it('should get reports for admin', async () => {
    await reportModel.create({ domain: 'test.com', submittedBy: 'user1' });
    const reports = await service.getReports('anyId', 'admin');
    expect(reports.length).toBe(1);
    expect(reports[0].domain).toBe('test.com');
  });

  it('should analyze report', async () => {
    const report = await reportModel.create({ domain: 'analyze.com', submittedBy: 'user1' });
    const result = await service.analyzeReport(report._id.toString());
    expect(result).toEqual({ result: 'safe' });
  });

  it('should throw NotFoundException for non-existent report', async () => {
    await expect(service.analyzeReport('000000000000000000000000')).rejects.toThrow(NotFoundException);
  });

  it('should claim a report', async () => {
    const report = await reportModel.create({
      domain: 'claim.com',
      submittedBy: 'user1',
      analysisStatus: 'pending',
    });
    const updated = await service.claimReport(report._id.toString(), 'investigator1');
    expect(updated.analysisStatus).toBe('in-progress');
    expect(updated.reviewedBy).toBe('investigator1');
  });

  it('should throw NotFoundException for claim on non-pending report', async () => {
    const report = await reportModel.create({
      domain: 'claim-error.com',
      submittedBy: 'user1',
      analysisStatus: 'in-progress',
    });
    await expect(service.claimReport(report._id.toString(), 'investigator1')).rejects.toThrow(NotFoundException);
  });

  it('should release a report', async () => {
    const report = await reportModel.create({
      domain: 'release.com',
      submittedBy: 'user1',
      reviewedBy: 'investigator1',
      analysisStatus: 'in-progress',
    });
    const released = await service.releaseReport(report._id.toString(), 'investigator1');
    expect(released.analysisStatus).toBe('pending');
    expect(released.reviewedBy).toBeNull();
  });

  it('should throw error for release on unclaimed report', async () => {
    const report = await reportModel.create({
      domain: 'release-error.com',
      submittedBy: 'user1',
      analysisStatus: 'pending',
    });
    await expect(service.releaseReport(report._id.toString(), 'investigator1')).rejects.toThrow();
  });

  it('should update decision and notify reporter', async () => {
    const user = await userModel.create({
      firstname: 'Submitter',
      username: 'user1',
        lastname: 'One',
      email: 'user1@example.com',
      password: 'password',
      role: 'general',
    });
    const report = await reportModel.create({
      domain: 'decision.com',
      submittedBy: user._id,
      reviewedBy: 'investigator1',
      analysisStatus: 'in-progress',
    });
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const updated = await service.updateDecisionAndReviewer(report._id.toString(), 'malicious', 'investigator1');
    expect(updated.investigatorDecision).toBe('malicious');
    expect(spy).toHaveBeenCalled();
    const transporterInstance = spy.mock.results[0].value;
    expect(transporterInstance.sendMail).toHaveBeenCalled();
  });

  it('should throw BadRequestException for invalid updateAnalysis', async () => {
    const report = await reportModel.create({ domain: 'invalid.com', submittedBy: 'user1' });
    await expect(
      service.updateAnalysis(report._id.toString(), { analysisStatus: AnalysisStatusUnified.Done })
    ).rejects.toThrow(BadRequestException);
  });
});
