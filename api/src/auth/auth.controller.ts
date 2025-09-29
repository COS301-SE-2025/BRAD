import { Controller, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { BotGuard } from './guards/bot.guard';
import { Public } from './decorators/public.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
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
@Post('verify-otp')
@ApiOperation({ summary: 'Verify OTP and complete login' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      tempToken: { type: 'string', example: 'eyJhbGciOi...' },
      otp: { type: 'string', example: '123456' },
      rememberMe: { type: 'boolean', example: true },   // ✅ add this
    },
  },
})
@ApiResponse({ status: 200, description: 'OTP verified, JWT returned' })
@ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
async verifyOtp(@Body() body: { tempToken: string; otp: string; rememberMe: boolean }) {
  return this.authService.verifyOtp(body.tempToken, body.otp, body.rememberMe ?? false);
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

@Public()
@Patch('change-password/:username')
@ApiOperation({ summary: 'Change password after receiving one-time password' })
@ApiParam({ name: 'username', type: 'string' })
@ApiBody({ type: ChangePasswordDto })
@ApiResponse({ status: 200, description: 'Password changed successfully' })
@ApiResponse({ status: 400, description: 'Invalid credentials or expired OTP' })
async changePassword(
  @Param('username') username: string,
  @Body() dto: ChangePasswordDto,
) {
  return this.authService.changePassword(username, dto);
}

@UseGuards(AuthGuard)
@Patch('update-user')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Update user profile' })
@ApiBody({ type: UpdateUserDto })
async updateUser(@Req() req: Request, @Body() dto: UpdateUserDto) {
  const user = req['user'] as JwtPayload;
  return this.authService.updateUser(user.id, dto);
}



}
