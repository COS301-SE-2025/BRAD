import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../../src/admin/admin.service';
import { User, UserSchema } from '../../src/schemas/user.schema';
import { connectInMemoryDB, disconnectInMemoryDB, mongoServer } from '../setup-test-db';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateUserDto } from '../../src/admin/dto/create-user.dto'; // Ensure this import matches your project structure
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { NotFoundException, BadRequestException } from '@nestjs/common';



jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

describe('AdminService (Integration)', () => {
  let service: AdminService;
  let userModel: Model<User>;

  beforeAll(async () => {
    await connectInMemoryDB();

    const UserSchemaWithExtras = new Schema(
      {
        firstname: String,
        lastname: String,
        email: String,
        username: String,
        password: String,
        role: String,
        mustChangePassword: Boolean,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
      },
      { timestamps: true },
    );

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ EMAIL_USER: 'test@example.com', EMAIL_PASS: 'testpass', DOMAIN_NAME: 'http://test.com' })],
        }),
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: mongoServer.getUri(),
          }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchemaWithExtras }]),
      ],
      providers: [
        AdminService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'EMAIL_USER' ? 'test@example.com' : key === 'EMAIL_PASS' ? 'testpass' : 'http://test.com',
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectInMemoryDB();
  });
it('should add a new admin', async () => {
  const dto = { firstname: 'Admin', lastname: 'One', email: 'admin1@example.com', username: 'admin1', password: 'pass123' };
  const result = await service.addAdmin(dto);
  expect(result.firstname).toBe('Admin');
  expect(result.password).toBeUndefined();
  expect(result.role).toBe('admin'); // Use result to verify role
  const user = await userModel.findOne({ username: 'admin1' }); // Optional: verify in DB without !
  if (user) {
    expect(user.role).toBe('admin'); // Safe check if needed
  } else {
    throw new Error('User not found in database after addAdmin');
  }
});

  it('should throw ConflictException for duplicate email/username', async () => {
    const dto = { firstname: 'Admin', lastname: 'Two', email: 'admin2@example.com', username: 'admin2', password: 'pass123' };
    await service.addAdmin(dto);
    await expect(service.addAdmin(dto)).rejects.toThrow(ConflictException);
  });

  it('should promote user to investigator', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user1', email: 'user1@example.com', password: 'pass', role: 'general' }).save();
    const updated = await service.promoteUser(user._id.toString());
    expect(updated.role).toBe('investigator');
  });

  it('should throw BadRequestException for promoting already investigator', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user2', email: 'user2@example.com', password: 'pass', role: 'investigator' }).save();
    await expect(service.promoteUser(user._id.toString())).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for promoting non-existent user', async () => {
    await expect(service.promoteUser('000000000000000000000000')).rejects.toThrow(NotFoundException);
  });

  it('should demote user to general', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user3', email: 'user3@example.com', password: 'pass', role: 'investigator' }).save();
    const updated = await service.demoteUser(user._id.toString());
    expect(updated.role).toBe('general');
  });

  it('should throw BadRequestException for demoting already general user', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user4', email: 'user4@example.com', password: 'pass', role: 'general' }).save();
    await expect(service.demoteUser(user._id.toString())).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for demoting non-existent user', async () => {
    await expect(service.demoteUser('000000000000000000000000')).rejects.toThrow(NotFoundException);
  });

  it('should promote user to admin', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user5', email: 'user5@example.com', password: 'pass', role: 'general' }).save();
    const updated = await service.promoteToAdmin(user._id.toString());
    expect(updated.role).toBe('admin');
  });

  it('should throw BadRequestException for promoting already admin', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user6', email: 'user6@example.com', password: 'pass', role: 'admin' }).save();
    await expect(service.promoteToAdmin(user._id.toString())).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException for promoting to admin non-existent user', async () => {
    await expect(service.promoteToAdmin('000000000000000000000000')).rejects.toThrow(NotFoundException);
  });

  it('should get all users', async () => {
    await new userModel({ firstname: 'User1', username: 'user7', email: 'user7@example.com', password: 'pass', role: 'general' }).save();
    await new userModel({ firstname: 'User2', username: 'user8', email: 'user8@example.com', password: 'pass', role: 'investigator' }).save();
    const users = await service.getAllUsers();
    expect(users.length).toBe(2);
    expect(users[0].password).toBeUndefined();
    expect(users[1].password).toBeUndefined();
  });

  it('should delete a user', async () => {
    const user = await new userModel({ firstname: 'User', username: 'user9', email: 'user9@example.com', password: 'pass', role: 'general' }).save();
    const result = await service.deleteUser(user._id.toString());
    expect(result.message).toBe('User deleted successfully');
    const deleted = await userModel.findById(user._id);
    expect(deleted).toBeNull();
  });

  it('should throw NotFoundException for deleting non-existent user', async () => {
    await expect(service.deleteUser('000000000000000000000000')).rejects.toThrow(NotFoundException);
  });

  it('should create a user with one-time password and email', async () => {
    const dto: CreateUserDto = { firstname: 'New', lastname: 'User', email: 'new@example.com', username: 'newuser', role: 'general' }; // Matches CreateUserDto
    const spy = jest.spyOn(nodemailer, 'createTransport');
    const result = await service.createUser(dto);
    expect(result.firstname).toBe('New');
    expect(result.password).toBeUndefined();
    expect(result.mustChangePassword).toBe(true);
    expect(result.resetPasswordToken).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    const transporterInstance = spy.mock.results[0].value;
    expect(transporterInstance.sendMail).toHaveBeenCalled();
    const user = await userModel.findOne({ username: 'newuser' })!;
    expect(user).toBeDefined();
  });

  it('should throw ConflictException for duplicate user creation', async () => {
    const dto: CreateUserDto = { firstname: 'Dup', lastname: 'User', email: 'dup@example.com', username: 'dupuser', role: 'general' };
    await service.createUser(dto);
    await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
  });
});