import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { QueueService } from 'src/queue/queue.service';
import * as nodemailer from 'nodemailer';
import { connectInMemoryDB, disconnectInMemoryDB, clearDatabase, mongoServer } from './setup-test-db';
import { User } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt'; 
import { loginAndGetToken, createTestUser ,CreateUserOptions} from './auth.e2e-spec';

jest.setTimeout(60000);
let userModel: Model<User>;

describe('Report Module(e2e)', () => {
let app: INestApplication;
  let generalToken: string;
  let investigatorToken: string;
  let adminToken: string;
  let reportId: string;

  beforeAll(async () => {
    await connectInMemoryDB();

    const sendMailMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: sendMailMock } as any);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: mongoServer.getUri(),
          }),
        }),
      ],
    })
      .overrideProvider(QueueService)
      .useValue({ queueToFastAPI: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

const generalUser = await createTestUser(userModel, {
email: 'general@gmail.com',
      role: 'general',
    });

    const investigatorUser = await createTestUser(userModel, {
email: 'investigator@gmail.com',
      role: 'investigator',
    });

    const adminUser = await createTestUser(userModel, {
      email: 'admin@gmail.com',     
      role: 'admin',  
    });

    // ✅ Log in general user to get token
    investigatorToken = await loginAndGetToken(app, investigatorUser.email, 'Password123!');
    generalToken = await loginAndGetToken(app, generalUser.email, 'Password123!');
    adminToken = await loginAndGetToken(app, adminUser.email, 'Password123!');
  });

  afterAll(async () => {
    await clearDatabase();
    await disconnectInMemoryDB();
    await app.close();
  });

  it('/reports(POST) - should create a report', async () => {
    const res = await request(app.getHttpServer())
      .post('/report')
      .set('Authorization', `Bearer ${generalToken}`)
      .send({
        domain: 'phishing-portal.com',
        evidence: ['uploads/evidence/file1.png'],
      })
      .expect(201);

    expect(res.body).toHaveProperty('domain', 'phishing-portal.com');
    expect(res.body).toHaveProperty('submittedBy');
    reportId = res.body._id;
  });

  it('/reports (GET) - should fetch reports for a user', async () => {
  const res = await request(app.getHttpServer())
    .get('/reports')
    .set('Authorization', `Bearer ${generalToken}`)
    .expect(200);

  expect(Array.isArray(res.body)).toBe(true);
});

 it('/reports (GET) - should fetch all reports', async () => {
  const res = await request(app.getHttpServer())
    .get('/reports')
    .set('Authorization', `Bearer ${investigatorToken}`)
    .expect(200);

  expect(Array.isArray(res.body)).toBe(true);
});

 it('/reports (GET) - should fetch all reports', async () => {
  const res = await request(app.getHttpServer())
    .get('/reports')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(Array.isArray(res.body)).toBe(true);
});
it('/reports/:id/claim (POST) - investigator should claim a report', async () => {
  const res = await request(app.getHttpServer())
    .post(`/reports/${reportId}/claim`)
    .set('Authorization', `Bearer ${investigatorToken}`)
    .expect(201);

  expect(res.body).toHaveProperty('analysisStatus', 'in-progress');
  expect(res.body).toHaveProperty('reviewedBy', expect.any(String));
});

it('/reports/:id/release (POST) - investigator should release a report', async () => {
  const res = await request(app.getHttpServer())
    .post(`/reports/${reportId}/release`)
    .set('Authorization', `Bearer ${investigatorToken}`)
    .expect(201);

  expect(res.body).toHaveProperty('analysisStatus', 'pending');
});

it('/reports/:id/claim (POST) - investigator should claim a report', async () => {
  const res = await request(app.getHttpServer())
    .post(`/reports/${reportId}/claim`)
    .set('Authorization', `Bearer ${investigatorToken}`)
    .expect(201);

  expect(res.body).toHaveProperty('analysisStatus', 'in-progress');
  expect(res.body).toHaveProperty('reviewedBy', expect.any(String));
});

it('/report/:id/decision (PATCH) - investigator should submit decision', async () => {
  const res = await request(app.getHttpServer())
    .patch(`/report/${reportId}/decision`)
    .set('Authorization', `Bearer ${investigatorToken}`)
    .send({ verdict: 'malicious' })
    .expect(200);

  expect(res.body).toHaveProperty('investigatorDecision', 'malicious');
  expect(res.body).toHaveProperty('reviewedBy');
});

it('/forensics/:id (GET) - admin should perform forensic analysis', async () => {
  const res = await request(app.getHttpServer())
    .get(`/forensics/${reportId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(res.body).toHaveProperty('domain');
  expect(res.body).toHaveProperty('score');
  expect(res.body).toHaveProperty('verdict');
});

it('/forensics/:id (GET) - admin should perform forensic analysis', async () => {
  const res = await request(app.getHttpServer())
    .get(`/forensics/${reportId}`)
    .set('Authorization', `Bearer ${investigatorToken}`)
    .expect(200);

  expect(res.body).toHaveProperty('domain');
  expect(res.body).toHaveProperty('score');
  expect(res.body).toHaveProperty('verdict');
});
});
