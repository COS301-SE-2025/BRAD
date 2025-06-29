import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException,BadRequestException,NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { BlacklistedToken } from '../schemas/blacklisted-token.schema';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BlacklistedToken.name) private blacklistModel: Model<BlacklistedToken>,
    private configService: ConfigService,
    private jwtService: JwtService,) {}

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();

    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = new this.userModel({
      firstname: dto.firstname,
      lastname: dto.lastname,
      username,
      email,
      password: hashedPassword,
      role: 'general',
    });

    try {
      await newUser.save();
      return { userId: newUser._id.toString() };
    } catch (err) {
      console.error('Error registering user:', err);
      throw new InternalServerErrorException('Could not register user');
    }
  }

  async login(dto: LoginDto): Promise<{ token: string; refreshToken: string; user: any }> {
    const identifier = dto.identifier.trim();
    const emailNormalized = identifier.toLowerCase();

    const user = await this.userModel.findOne({
      $or: [{ email: emailNormalized }, { username: identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.mustChangePassword) {
      throw new UnauthorizedException('You must change your password before logging in');
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT_SECRET or JWT_REFRESH_SECRET is not defined');
    }

    const payload = {
      id: user._id.toString(),
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    user.refreshToken = refreshToken;
    await user.save();

    const { password, ...userData } = user.toObject();

    return {
      token,
      refreshToken,
      user: userData,
    };
  }

  async logout(userId: string, request: Request): Promise<{ message: string }> {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization header missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded: any = this.jwtService.verify(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await this.blacklistModel.create({ token, expiresAt });

      return { message: 'Logout successful' };
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

 async forgotPassword(email: string): Promise<{ message: string }> {
  const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: this.configService.get<string>('EMAIL_USER'),
      pass: this.configService.get<string>('EMAIL_PASS'),
    },
  });

  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  const mailOptions = {
    to: user.email,
    from: this.configService.get<string>('EMAIL_USER'),
    subject: 'Password Reset Request',
    text: `You requested a password reset.\n\nClick the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, ignore this email.`,
  };

  await transporter.sendMail(mailOptions);

  return { message: 'Password reset email sent' };
}

async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const user = await this.userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid or expired reset token');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been reset successfully' };
}

async changePassword(username: string, dto: ChangePasswordDto): Promise<any> {
    const { OTP, newPassword } = dto;

    const user = await this.userModel.findOne({ username });

    if (!user) throw new NotFoundException('User not found');
    if (!user.mustChangePassword)
      throw new BadRequestException('Password change not required');

    const isMatch = await bcrypt.compare(OTP, user.password);
    if (!isMatch) throw new BadRequestException('Invalid one-time password');

    const hashedNew = await bcrypt.hash(newPassword, 10);

    user.password = hashedNew;
    user.mustChangePassword = false;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return { message: 'Password changed successfully. You can now log in.' };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userModel.findById(payload.id);

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign(
        { id: user._id.toString(), role: user.role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '1h',
        },
      );

      return { accessToken: newAccessToken };
    } catch (err) {
      console.error('Token verification failed:', err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
      to: user.email,
      from: this.configService.get<string>('EMAIL_USER'),
      subject: 'Password Reset Request',
      text: `You requested a password reset.\n\nClick the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    return { message: 'Password reset email sent' };
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.userModel.findOne({ username: dto.username });
      if (existing) throw new ConflictException('Username already taken');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
      if (existing) throw new ConflictException('Email already in use');
    }

    if (dto.firstname) user.firstname = dto.firstname;
    if (dto.lastname) user.lastname = dto.lastname;
    if (dto.username) user.username = dto.username;
    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.profileImage) user.profileImage = dto.profileImage;

    await user.save();

    const { password, refreshToken, ...cleaned } = user.toObject();
    return { message: 'Profile updated successfully', user: cleaned };
  }


}
