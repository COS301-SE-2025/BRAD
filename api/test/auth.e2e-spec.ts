import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { QueueService } from 'src/queue/queue.service';
import * as nodemailer from 'nodemailer';


jest.setTimeout(30000);

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let generalToken: string;
  let investigatorToken: string;
  let adminToken: string;
  let generalUserId: string;
  let testgeneral: string;
  let investigatorUserId: string;
  let adminUserId: string;

  const generalEmail = `general${Date.now()}@example.com`;
  const investigatorEmail = `investigator${Date.now()}@example.com`;
  const adminEmail = `admin${Date.now()}@example.com`;

  let reportId: string;

  beforeAll(async () => {
   const sendMailMock = jest.fn().mockResolvedValue(true);
  const createTransportMock = jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
    sendMail: sendMailMock,
  } as any);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(QueueService)
    .useValue({
      queueToFastAPI: jest.fn().mockResolvedValue(true),
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------- REGISTER GENERAL USER ----------------
  it('/auth/register (POST) - General User', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstname: 'generaluser',
        lastname: 'generaluserL',
        username: `generalUser${Date.now()}`,
        email: generalEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('userId');
    generalUserId = res.body.userId;
  });

   // ---------------- REGISTER INVESTIGATOR ----------------
  it('/auth/register (POST) - Investigator', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstname: 'investigatoruser',
        lastname: 'investigatoruserL',
        username: `investigatorUser${Date.now()}`,
        email: investigatorEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('userId');
    investigatorUserId = res.body.userId;
  });


   // ---------------- REGISTER ADMIN ----------------
  it('/auth/register (POST) - Admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstname: 'adminuser',
        lastname: 'adminuserL',
        username: `adminUser${Date.now()}`,
        email: adminEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('userId');
    adminUserId = res.body.userId;
  });

 // ---------------- PROMOTE ADMIN ----------------
it('/admin/promote-to-admin/:userId (PATCH) - Promote user to admin', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/promote-to-admin/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('role', 'admin');
  });

 // ---------------- PROMOTE to investigator ----------------
  it('/admin/promote/:userId (PATCH) - Promote general user to investigator', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/promote/${investigatorUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('role', 'investigator');
  });

  // ---------------- LOGIN GENERAL USER ----------------
  it('/auth/login (POST) - General User', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: generalEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    generalToken = res.body.token;
  });

 

  // ---------------- LOGIN INVESTIGATOR ----------------
  it('/auth/login (POST) - Investigator', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: investigatorEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    investigatorToken = res.body.token;
    investigatorUserId = res.body.user._id; // Store the user ID for later use
  });

 

  // ---------------- LOGIN ADMIN ----------------
  it('/auth/login (POST) - Admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: adminEmail,
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    adminToken = res.body.token;
    adminUserId = res.body.user._id; // Store the user ID for later use
  });

  // ---------------- UPDATE GENERAL USER PROFILE ----------------
  it('/auth/update-user (PATCH)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/update-user')
      .set('Authorization', `Bearer ${generalToken}`)
      .send({
        firstname: 'UpdatedGeneral',
        lastname: 'UpdatedLast',
        username: `updatedGeneralUser${Date.now()}`,
        email: `updated${generalEmail}`,
        currentPassword: 'Password123!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('firstname', 'UpdatedGeneral');
    expect(res.body).toHaveProperty('lastname', 'UpdatedLast');
    expect(res.body).toHaveProperty('email', `updated${generalEmail}`);
  });

// ---------------- UPDATE INVESTIGATOR USER PROFILE ----------------
    it('/auth/update-user (PATCH)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/update-user')
      .set('Authorization', `Bearer ${investigatorToken}`)
      .send({
        firstname: 'UpdatedInvestigator',
        lastname: 'UpdatedLast',
        username: `updatedInvestigatorUser${Date.now()}`,
        currentPassword: 'Password123!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('firstname', 'UpdatedInvestigator');
    expect(res.body).toHaveProperty('lastname', 'UpdatedLast');

  });

  // ---------------- SUBMIT REPORT ----------------
  it('/report (POST) - Submit report', async () => {
    const res = await request(app.getHttpServer())
      .post('/report')
      .set('Authorization', `Bearer ${generalToken}`)
      .send({
        domain: 'suspicious-domain.com',
      })
      .expect(201);

    expect(res.body).toHaveProperty('_id');
     // ✅ check default
    reportId = res.body._id;
  });

  // ---------------- GET REPORTS FOR GENERAL USER ----------------
  it('/reports (GET) - General user can fetch their reports', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', `Bearer ${generalToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('submittedBy');
  });

  // ---------------- GET REPORTS FOR INVESTIGATOR USER ----------------
it('/reports (GET) - investigator user can fetch  reports', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', `Bearer ${investigatorToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('submittedBy');
  });

  // ---------------- INVESTIGATOR CLAIMS REPORT ----------------
  it('/reports/:id/claim (POST) - Investigator claims report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/reports/${reportId}/claim`)
      .set('Authorization', `Bearer ${investigatorToken}`)
      .expect(201);

    expect(res.body).toHaveProperty('analysisStatus', 'in-progress');
    expect(res.body).toHaveProperty('reviewedBy');
  });

    // ---------------- PROMOTE USER ----------------
    it('/admin/promote/:userId (PATCH) - Promote general to investigator', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/promote/${generalUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('role', 'investigator');
    });

  // ---------------- DEMOTE USER ----------------
  it('/admin/demote/:userId (PATCH) - Demote investigator to general', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/demote/${investigatorUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('role', 'general');
  });

    it('/admin/users (GET) - Get all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).not.toHaveProperty('password');
  });

   it('/admin/delete/:userId (DELETE) - Delete a user', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/admin/delete/${investigatorUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });

   it('/admin/user (POST) - Create new user with OTP & email', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstname: 'OTPUser',
        lastname: 'OTPUserLast',
        username: `otpuser${Date.now()}`,
        email: `otpuser${Date.now()}@example.com`,
        role: 'general',
      })
      .expect(201);

    expect(res.body).toHaveProperty('firstname', 'OTPUser');
    expect(res.body).toHaveProperty('role', 'general');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('resetPasswordToken');
  });

 
});
