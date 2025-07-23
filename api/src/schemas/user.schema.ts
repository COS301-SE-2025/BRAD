import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ example: 'Tony', description: 'First name of the user' })
  @Prop({ required: true, trim: true })
  firstname: string;

  @ApiProperty({ example: 'Stark', description: 'Last name of the user' })
  @Prop({ required: true, trim: true })
  lastname: string;

  @ApiProperty({
    example: 'tony@example.com',
    description: 'Email address of the user',
    format: 'email',
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address'],
  })
  email: string;

  @ApiProperty({
    example: 'tony_stark',
    description: 'Unique username',
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    match: /^[A-Za-z0-9_.-]+$/,
  })
  username: string;

  @ApiProperty({
    example: 'hashedpassword123',
    description: 'User password (hashed)',
  })
  @Prop({ required: true })
  password: string;

  @Prop()
  profileImage?: string;

  @ApiProperty({
    example: 'general',
    enum: ['general', 'admin', 'investigator'],
    description: 'Role assigned to the user',
    default: 'general',
  })
  @Prop({ enum: ['general', 'admin', 'investigator'], default: 'general' })
  role: string;

  @ApiProperty({ example: '665d6ae5e9b6f0e17f463b8f', description: 'MongoDB ObjectId of the user' })
  _id?: Types.ObjectId;

  @Prop()
  refreshToken?: string;


    @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ default: false })
  mustChangePassword:boolean;

  @Prop({ required: false })
  profilePicture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
