import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from '../../src/report/report.service';
import { ForensicService } from '../../src/services/forensic.service';
import { QueueService } from '../../src/queue/queue.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { disconnectInMemoryDB, connectInMemoryDB, clearDatabase, mongoServer } from '../setup-test-db';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

    const module: TestingModule = await Test.createTestingModule({
    imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  MongooseModule.forRootAsync({
    useFactory: async () => ({
      uri: mongoServer.getUri(),
    }),
  }),
  MongooseModule.forFeature([
    { name: 'Report', schema: new (require('mongoose').Schema)({ domain: String, submittedBy: String, evidence: [String], analyzed: Boolean, analysisStatus: String, reviewedBy: String }) },
    { name: User.name, schema: UserSchema },
  ]),
]
,
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

  afterAll(async () => {
    await clearDatabase();
    await disconnectInMemoryDB();
  });

  beforeEach(async () => {
  await clearDatabase();
});

  afterEach(async () => {
    await clearDatabase();
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
