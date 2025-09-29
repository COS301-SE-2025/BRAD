import { Document } from 'mongoose';

export interface User extends Document {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
  role: 'general' | 'admin' | 'investigator';
  createdAt?: Date;
  updatedAt?: Date;
}
