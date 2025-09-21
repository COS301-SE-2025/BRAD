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

  
});
