import { Injectable, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, private configService: ConfigService) {}

  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password -refreshToken');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }


  async addAdmin(dto: any): Promise<any> {
    const { firstname, lastname, email, username, password } = dto;

    const existing = await this.userModel.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new this.userModel({
      firstname,
      lastname,
      email,
      username,
      password: hashedPassword,
      role: 'admin',
    });

    try {
      await admin.save();
      const { password: _, ...data } = admin.toObject();
      return data;
    } catch (err) {
      console.error('Add admin failed:', err);
      throw new InternalServerErrorException('Error adding admin');
    }
  }

  async promoteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'investigator') throw new BadRequestException('User is already an investigator');

    user.role = 'investigator';
    return user.save();
  }

  async demoteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'general') throw new BadRequestException('User is already a general user');

    user.role = 'general';
    return user.save();
  }

   async promoteToAdmin(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new BadRequestException('User is already an admin');

    user.role = 'admin';
    return user.save();
  }

  async getAllUsers() {
    return this.userModel.find().select('-password');
  }

   async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userModel.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userModel.findOne({ email: dto.email });
      if (emailExists && emailExists._id.toString() !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.username && dto.username !== user.username) {
      const usernameExists = await this.userModel.findOne({ username: dto.username });
      if (usernameExists && usernameExists._id.toString() !== userId) {
        throw new ConflictException('Username already in use');
      }
    }

    Object.assign(user, dto);
    await user.save();

    const { password, refreshToken, ...userData } = user.toObject();
    return userData;
  }


  async createUser(dto: CreateUserDto): Promise<any> {
  const { firstname, lastname, email, username,role } = dto;

  const existing = await this.userModel.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new ConflictException('Email or username already in use');
  }
   const oneTimePassword = Math.floor(10000 + Math.random() * 90000).toString();
  const hashedPassword = await bcrypt.hash(oneTimePassword, 10);

   const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

  const user = new this.userModel({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    role,
    mustChangePassword: true,
    resetPasswordToken: token,
    resetPasswordExpires: expires,
  });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
 const resetLink = `http://localhost:5173/change-password?token=${token}`;

 const mailOptions = {
    to: user.email,
    from: this.configService.get<string>('EMAIL_USER'),
    subject: 'Your One-Time Access & Password Reset Link',
    text: `Hello ${firstname},\n\nYour one-time password is: ${oneTimePassword}\nPlease use the following link to change your password before logging in:\n\n${resetLink}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this,ignore this email.`,
  };
await transporter.sendMail(mailOptions);
try {
  await user.save();
  await transporter.sendMail(mailOptions);

  const { password: _, resetPasswordToken, resetPasswordExpires, ...data } = user.toObject();
  return data;
} catch (err) {
  console.error('User creation or email failed:', err);
  throw new InternalServerErrorException('Error creating user or sending email');
}
}
}
