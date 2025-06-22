import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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
      role: 'admin',
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
}
