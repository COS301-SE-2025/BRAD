

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const mockAuthService = {
  register: jest.fn(dto => ({ ...dto, id: 'mockUserId' })),
  login: jest.fn(dto => ({ token: 'mock-jwt-token' })),
};

describe('AuthController (Unit)', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    const dto: RegisterDto = {
      firstname: 'Jane',
      lastname: 'Doe',
      username: 'janedoe',
      email: 'jane@example.com',
      password: 'password123',
     
    };
    const result = await controller.register(dto);
    expect(result).toHaveProperty('id');
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
  });

  it('should login a user', async () => {
    const dto: LoginDto = {
      identifier: 'janedoe',
      password: 'password123',
    };
    const result = await controller.login(dto);
    expect(result).toHaveProperty('token', 'mock-jwt-token');
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });
});