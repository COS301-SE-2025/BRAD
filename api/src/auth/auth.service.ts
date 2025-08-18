import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException,BadRequestException,NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>,
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
      role: 'investigator',
    });

    try {
      await newUser.save();
      return { userId: newUser._id.toString() };
    } catch (err) {
      console.error('Error registering user:', err);
      throw new InternalServerErrorException('Could not register user');
    }
  }

  async login(dto: LoginDto): Promise<{ token: string; user: any }> {
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

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const payload = {
      id: user._id.toString(),
      role: user.role,
    };
    
    const token = this.jwtService.sign(payload);
    
    const { password, ...userData } = user.toObject();

    return {
      token,
      user: userData,
    };
  }

 async forgotPassword(email: string): Promise<{ message: string }> {
  const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save token and expiration
  user.resetPasswordToken = token;
  user.resetPasswordExpires = expires;
  await user.save();

  // Create transporter
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

  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  // Verify password
  const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!isPasswordValid) throw new BadRequestException('Incorrect password');

  // Allowed fields to update
  const allowedFields = ['firstname', 'lastname', 'username', 'email'];
  for (const key of allowedFields) {
    if (dto[key] && dto[key].trim() !== '') {
      user[key] = dto[key].trim();
    }
  }

  await user.save();
  return user;
}
}
