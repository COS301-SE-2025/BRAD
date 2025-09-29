import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { disconnectInMemoryDB, connectInMemoryDB, clearDatabase } from '../setup-test-db';

// Mock nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn().mockResolvedValue(true);
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  };
});

process.env.JWT_SECRET = 'test_secret';

describe('AuthService (Integration)', () => {
  let service: AuthService;
  let module: TestingModule;
  let mockSendMail: jest.Mock;

  beforeAll(async () => {
    // Access the mocked sendMail function
    mockSendMail = jest.requireMock('nodemailer').createTransport().sendMail;

    await connectInMemoryDB();

    module = await Test.createTestingModule({
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
    await module.close(); // Close NestJS module to release resources
    await disconnectInMemoryDB();
  });

  afterEach(async () => {
    await clearDatabase();
    mockSendMail.mockClear();
  });

  describe('register', () => {
    it('should create a user successfully', async () => {
      const dto: RegisterDto = {
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password123!', // Added special character
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
        password: 'Password123!', // Added special character
      };

      await service.register(dto);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with email and verify OTP', async () => {
      const registerDto: RegisterDto = {
        firstname: 'Mike',
        lastname: 'Smith',
        username: 'mike',
        email: 'mike@example.com',
        password: 'Password123!', // Added special character
      };

      await service.register(registerDto);

      const loginDto: LoginDto = {
        identifier: 'mike@example.com',
        password: 'Password123!', // Match the password used in registration
      };

      // Step 1: Perform login to get tempToken
      const loginResult = await service.login(loginDto);
      expect(loginResult).toHaveProperty('tempToken');
      expect(loginResult.message).toBe('OTP sent to your email. Please verify.');

      // Step 2: Mock OTP generation for predictability
      const mockOtp = '550000'; // Predictable OTP
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // Makes OTP: Math.floor(100000 + 0.5 * 900000) = 550000
      jest.spyOn(global.Math, 'floor').mockImplementation((num) => num);

      // Re-run login to ensure OTP is predictable
      await service.login(loginDto); // Generates OTP '550000'

      // Step 3: Verify OTP
      const verifyResult = await service.verifyOtp(loginResult.tempToken, mockOtp);
      expect(verifyResult).toHaveProperty('token');
      expect(verifyResult.user.email).toBe('mike@example.com');

      // Restore mocks
      jest.spyOn(global.Math, 'random').mockRestore();
      jest.spyOn(global.Math, 'floor').mockRestore();
    });

    it('should fail with wrong password', async () => {
      const registerDto: RegisterDto = {
        firstname: 'Anna',
        lastname: 'Taylor',
        username: 'anna',
        email: 'anna@example.com',
        password: 'Password123!', // Added special character
      };

      await service.register(registerDto);

      const dto: LoginDto = {
        identifier: 'anna@example.com',
        password: 'wrongpass',
      };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});