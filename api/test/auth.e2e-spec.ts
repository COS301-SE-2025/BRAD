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

jest.setTimeout(60000); // increase timeout just in case
let userModel: Model<User>;

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let generalToken: string;
  const generalEmail = `general${Date.now()}@example.com`;
  const adminEmail=`admin${Date.now()}@example.com`;

    let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // 1️⃣ Start in-memory MongoDB
    await connectInMemoryDB();

    // 2️⃣ Mock nodemailer
    const sendMailMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({ sendMail: sendMailMock } as any);

   // Override MongooseModule to use in-memory MongoDB
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

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // ✅ This will now work
  const adminUser = new userModel({
    firstname: 'Admin',
    lastname: 'User',
    username: `admin${Date.now()}`,
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
  });

  await adminUser.save();
  });


  
  afterAll(async () => {
    await clearDatabase();
    await disconnectInMemoryDB();
    await app.close();
  });

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
  });


  it('/auth/login (POST) - Admin User', async () => {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      identifier: adminEmail, // same one you seeded
      password: 'Password123!',
    })
    .expect(201);

  expect(res.body).toHaveProperty('token');
  adminToken = res.body.token;
});


  it('/auth/login (POST) - General User', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: generalEmail, password: 'Password123!' })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    generalToken = res.body.token;
  });
  it('/auth/forgot-password (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: generalEmail })
      .expect(201);

    expect(res.body).toHaveProperty('message');
  });

   it('/auth/reset-password (POST) - Invalid Token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        token: 'invalidtoken',
        newPassword: 'NewPassword123!',
      })
      .expect(401);

    expect(res.body.message).toMatch(/Invalid|expired/i);
  });

  it('/auth/update-user (PATCH)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/auth/update-user')
      .set('Authorization', `Bearer ${generalToken}`)
      .send({
        firstname: 'UpdatedGeneral',
        lastname: 'Usergeneral',
        currentPassword: 'Password123!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('firstname', 'UpdatedGeneral');
  });

});
