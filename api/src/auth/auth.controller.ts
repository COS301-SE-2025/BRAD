import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user and return a JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful with JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

@Public()
@Post('forgot-password')
@ApiOperation({ summary: 'Request password reset link by email' })
@ApiBody({ schema: { example: { email: 'user@example.com' } } })
@ApiResponse({ status: 200, description: 'Reset email sent' })
@ApiResponse({ status: 404, description: 'User not found' })
async forgotPassword(@Body('email') email: string) {
  return this.authService.forgotPassword(email);
}

@Public()
@Post('reset-password')
@ApiOperation({ summary: 'Reset user password using token' })
@ApiBody({ type: ResetPasswordDto })
@ApiResponse({ status: 200, description: 'Password reset successful' })
@ApiResponse({ status: 400, description: 'Invalid or expired token' })
async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.token, dto.newPassword);
}

}
