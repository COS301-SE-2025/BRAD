import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { connectInMemoryDB, disconnectInMemoryDB, clearDatabase } from './setup-test-db';

describe('ReportController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    await connectInMemoryDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await disconnectInMemoryDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  const registerAndLoginUser = async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'pass1234',
        confirmPassword: 'pass1234',
        role: 'general',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'johndoe', password: 'pass1234' });

    jwtToken = loginRes.body.token;
  };

  it('should return user reports when authenticated', async () => {
    await registerAndLoginUser();

    // Submit a report
    const reportRes = await request(app.getHttpServer())
      .post('/report')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ domain: 'malicious.com' });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body).toHaveProperty('_id');

    // Get reports
    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].domain).toBe('malicious.com');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app.getHttpServer()).get('/reports');
    expect(res.status).toBe(401);
  });

  it('should return empty array if user has no reports', async () => {
    await registerAndLoginUser();

    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
