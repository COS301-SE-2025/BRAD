import { Injectable, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

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

  async getAllUsers() {
    return this.userModel.find().select('-password');
  }

   async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.userModel.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
  
}
