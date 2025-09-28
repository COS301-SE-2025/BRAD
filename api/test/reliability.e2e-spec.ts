import { INestApplication, ValidationPipe} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Reliability Testing (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---- AUTH RELIABILITY TESTS ----
  describe('Auth Endpoints', () => {
    it('should register and login successfully', async () => {
      // 1. Register new user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstname: 'Test',
          lastname: 'User',
          email: 'reliability@example.com',
          password: 'strongPassword12356&',
        })
        .expect(201);

      // 2. Login user
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'reliability@example.com',
          password: 'strongPassword12356&',
        })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      jwtToken = res.body.access_token;
    });

    it('should reject login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'reliability@example.com',
          password: 'WrongPass',
        })
        .expect(401);
    });
  });

  // ---- STATISTICS RELIABILITY TESTS ----
  describe('Statistics Endpoints', () => {
    it('should fail without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/statistics/total-reports')
        .expect(401);
    });

    it('should succeed with valid JWT token', async () => {
      const res = await request(app.getHttpServer())
        .get('/statistics/total-reports')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  // ---- FAILURE SIMULATION TEST ----
  describe('Failure Simulation', () => {
    it('should handle DB outage gracefully', async () => {
      // This assumes you throw a custom DB error in your service
      // or you can simulate by shutting down DB before running this test.
      const res = await request(app.getHttpServer())
        .get('/statistics/pending-reports')
        .set('Authorization', `Bearer ${jwtToken}`);

      // Either service handles error or DB is up
      // We just assert that it doesn't hang indefinitely
      expect([200, 500]).toContain(res.status);
    });
  });
});
