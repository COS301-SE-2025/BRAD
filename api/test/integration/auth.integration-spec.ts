import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {AuthService} from '../../src/auth/auth.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { disconnectInMemoryDB, connectInMemoryDB,clearDatabase } from '../setup-test-db';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));
process.env.JWT_SECRET = 'test_secret';

describe('AuthService (Integration)', () => {
  let service: AuthService;

  beforeAll(async () => {
    await connectInMemoryDB();

   const module: TestingModule = await Test.createTestingModule({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: (global as any).__MONGO_URI__ || (await import('../setup-test-db')).mongoServer.getUri(),
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: 'test_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
}).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await disconnectInMemoryDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('register', () => {
    it('should create a user successfully', async () => {
      const dto: RegisterDto = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const result = await service.register(dto);
      expect(result).toHaveProperty('userId');
    });

    it('should not allow duplicate user registration', async () => {
      const dto: RegisterDto = {
        firstname: 'Jane',
        lastname: 'Doe',
        username: 'janedoe',
        email: 'jane@example.com',
        password: 'Password123',
      };

      await service.register(dto);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

 
});
