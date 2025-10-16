
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User } from '../../src/schemas/user.schema';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { ChangePasswordDto } from '../../src/auth/dto/change-password.dto';
import { UpdateUserDto } from '../../src/auth/dto/update-user.dto';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

// Mock nodemailer
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn().mockResolvedValue(true);
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: mockSendMail,
    }),
  };
});

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mockedToken'),
  }),
}));

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let userModel: Partial<Model<User>>;
  let configService: Partial<ConfigService>;
  let jwtService: Partial<JwtService>;
  let mockSendMail: jest.Mock;

  const mockUser = {
    _id: '12345',
    firstname: 'John',
    lastname: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    password: '$2b$10$hashedpassword',
    role: 'general',
    failedLoginAttempts: 0,
    lockUntil: undefined,
    otp: undefined,
    otpExpires: undefined,
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    mustChangePassword: false,
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn().mockReturnValue({
      _id: '12345',
      firstname: 'John',
      lastname: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      role: 'general',
    }),
  };

  beforeEach(async () => {
    // Access the mocked sendMail function
    mockSendMail = jest.requireMock('nodemailer').createTransport().sendMail;

    // Mock userModel
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    // Mock ConfigService
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'EMAIL_USER') return 'test@example.com';
        if (key === 'EMAIL_PASS') return 'testpass';
        return null;
      }),
    };

    // Mock JwtService
    jwtService = {
      sign: jest.fn().mockReturnValue('mockedJwtToken'),
      verify: jest.fn().mockReturnValue({ id: '12345', stage: 'otp' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserModel', useValue: userModel },
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePassword', () => {
    it('should validate a correct password', () => {
      const result = service['validatePassword']('Pass123!');
      expect(result).toEqual({ isValid: true, message: '' });
    });

 

    it('should reject password without uppercase letter', () => {
      const result = service['validatePassword']('pass123!');
      expect(result).toEqual({
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      });
    });

    it('should reject password without lowercase letter', () => {
      const result = service['validatePassword']('PASS123!');
      expect(result).toEqual({
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      });
    });

    it('should reject password without number', () => {
      const result = service['validatePassword']('Password!');
      expect(result).toEqual({
        isValid: false,
        message: 'Password must contain at least one number',
      });
    });

    it('should reject password without special character', () => {
      const result = service['validatePassword']('Password123');
      expect(result).toEqual({
        isValid: false,
        message: 'Password must contain at least one special character',
      });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstname: 'John',
      lastname: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password123!',
    };



    it('should throw ConflictException for duplicate email or username', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(userModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'john@example.com' }, { username: 'johndoe' }],
      });
    });

    it('should throw BadRequestException for invalid password', async () => {
      const invalidDto = { ...registerDto, password: 'pass123' };
      await expect(service.register(invalidDto)).rejects.toThrow(BadRequestException);
    });

  });

  describe('login', () => {
    const loginDto: LoginDto = {
      identifier: 'john@example.com',
      password: 'Password123!',
    };

    it('should login successfully and return tempToken', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashedotp' as never);
      jest.spyOn(global.Math, 'random').mockReturnValue(0.5); // OTP: 550000

      const result = await service.login(loginDto);
      expect(result).toEqual({
        tempToken: 'mockedJwtToken',
        message: 'OTP sent to your email. Please verify.',
      });
      expect(userModel.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'john@example.com' }, { username: 'john@example.com' }],
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: '12345', stage: 'otp' },
        { expiresIn: '5m' },
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.failedLoginAttempts).toBe(1);
    });

    it('should lock account after max failed attempts', async () => {
      const lockedUser = { ...mockUser, failedLoginAttempts: 4 };
      userModel.findOne = jest.fn().mockResolvedValue(lockedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(lockedUser.save).toHaveBeenCalled();
      expect(lockedUser.failedLoginAttempts).toBe(5);
      expect(lockedUser.lockUntil).toBeDefined();
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockUntil: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes in future
      };
      userModel.findOne = jest.fn().mockResolvedValue(lockedUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return token and user', async () => {
      userModel.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        otp: '$2b$10$hashedotp',
        otpExpires: new Date(Date.now() + 1000 * 60), // Not expired
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.verifyOtp('mockedJwtToken', '550000');
      expect(result).toEqual({
        token: 'mockedJwtToken',
        user: {
          _id: '12345',
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
          role: 'general',
        },
      });
      expect(jwtService.verify).toHaveBeenCalledWith('mockedJwtToken');
      expect(userModel.findById).toHaveBeenCalledWith('12345');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid temp token', async () => {
      jwtService.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(service.verifyOtp('invalidToken', '550000')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid login stage', async () => {
      jwtService.verify = jest.fn().mockReturnValue({ id: '12345', stage: 'invalid' });
      await expect(service.verifyOtp('mockedJwtToken', '550000')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for missing user or OTP', async () => {
      userModel.findById = jest.fn().mockResolvedValue(null);
      await expect(service.verifyOtp('mockedJwtToken', '550000')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      userModel.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        otp: '$2b$10$hashedotp',
        otpExpires: new Date(Date.now() - 1000), // Expired
      });
      await expect(service.verifyOtp('mockedJwtToken', '550000')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      userModel.findById = jest.fn().mockResolvedValue({
        ...mockUser,
        otp: '$2b$10$hashedotp',
        otpExpires: new Date(Date.now() + 1000 * 60),
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.verifyOtp('mockedJwtToken', '550000')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email', async () => {
      await service['sendOtpEmail'](mockUser as any, '550000');
      expect(configService.get).toHaveBeenCalledWith('EMAIL_USER');
      expect(configService.get).toHaveBeenCalledWith('EMAIL_PASS');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Your MFA Verification Code',
          text: expect.stringContaining('Your one-time password (OTP) is: 550000'),
        }),
      );
    });
  });

  describe('sendLockoutNotification', () => {
    it('should send lockout notification email', async () => {
      await service['sendLockoutNotification'](mockUser as any);
      expect(configService.get).toHaveBeenCalledWith('EMAIL_USER');
      expect(configService.get).toHaveBeenCalledWith('EMAIL_PASS');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Account Locked Due to Failed Login Attempts',
          text: expect.stringContaining('Your account has been locked due to 5 failed login attempts'),
        }),
      );
    });

    it('should log error but not throw on email failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Email error'));
      await expect(service['sendLockoutNotification'](mockUser as any)).resolves.toBeUndefined();
      expect(mockSendMail).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(mockUser);
      // No need for jest.spyOn(crypto, 'randomBytes') since crypto is mocked globally

      const result = await service.forgotPassword('john@example.com');
      expect(result).toEqual({ message: 'Password reset email sent' });
      expect(userModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.save).toHaveBeenCalled();
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: 'Password Reset Request',
          text: expect.stringContaining('Click the link below to reset your password'),
        }),
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.forgotPassword('nonexistent@example.com')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'mockedToken',
        resetPasswordExpires: new Date(Date.now() + 1000 * 60),
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhashedpassword' as never);

      const result = await service.resetPassword('mockedToken', 'NewPassword123!');
      expect(result).toEqual({ message: 'Password has been reset successfully' });
      expect(userModel.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'mockedToken',
        resetPasswordExpires: { $gt: expect.any(Date) },
      });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid or expired token', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.resetPassword('invalidToken', 'NewPassword123!')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      OTP: 'Password123!',
      newPassword: 'NewPassword123!',
    };

    it('should change password successfully', async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        mustChangePassword: true,
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$newhashedpassword' as never);

      const result = await service.changePassword('johndoe', changePasswordDto);
      expect(result).toEqual({ message: 'Password changed successfully. You can now log in.' });
      expect(userModel.findOne).toHaveBeenCalledWith({ username: 'johndoe' });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      userModel.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.changePassword('nonexistent', changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if password change not required', async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        mustChangePassword: false,
      });
      await expect(service.changePassword('johndoe', changePasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      userModel.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        mustChangePassword: true,
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.changePassword('johndoe', changePasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      currentPassword: 'Password123!',
      firstname: 'Jane',
      lastname: 'Smith',
      username: 'janesmith',
      email: 'jane@example.com',
    };

    it('should update user successfully', async () => {
      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.updateUser('12345', updateUserDto);
      expect(result).toEqual(mockUser);
      expect(userModel.findById).toHaveBeenCalledWith('12345');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.firstname).toBe('Jane');
      expect(mockUser.lastname).toBe('Smith');
      expect(mockUser.username).toBe('janesmith');
      expect(mockUser.email).toBe('jane@example.com');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      userModel.findById = jest.fn().mockResolvedValue(null);
      await expect(service.updateUser('12345', updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for incorrect password', async () => {
      userModel.findById = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.updateUser('12345', updateUserDto)).rejects.toThrow(BadRequestException);
    });
  });
});
