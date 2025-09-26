import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../../src/report/report.service';
import { ForensicService } from '../../src/services/forensic.service';
import { QueueService } from '../../src/queue/queue.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { disconnectInMemoryDB, connectInMemoryDB, mongoServer } from '../setup-test-db'; // Removed clearDatabase as we're handling it manually
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { ConfigModule } from '@nestjs/config';

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
      },
      { timestamps: true }, // Added this to fix undefined date error in email notification
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
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
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    reportModel = module.get<Model<any>>(getModelToken('Report'));
  });

  beforeEach(async () => {
    await userModel.deleteMany({}); // Specific clear for reliability
    await reportModel.deleteMany({}); // Specific clear for reliability
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

    expect(spy).toHaveBeenCalled(); // transporter created

    // get the mock transporter instance created by service
    const transporterInstance = spy.mock.results[0].value;
    expect(transporterInstance.sendMail).toHaveBeenCalled();
  });

  it('should get reports for admin', async () => {
    const report = await reportModel.create({ domain: 'test.com', submittedBy: 'user1' });
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
    await expect(service.analyzeReport('000000000000000000000000')).rejects.toThrow();
  });
});