import { UseGuards, Req, Body, Controller, Post, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
ApiParam,
} from '@nestjs/swagger';

@ApiTags('User & Authentication')
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

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invalidate the user\'s session/token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async logout(@Req() req: Request) {
    //const userId = req.user['sub'] || req.user['id'];
    const userId = (req.user as any).sub || (req.user as any).id;
    return this.authService.logout(userId, req);
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Accepts a refresh token and returns a new access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get logged-in user\'s profile' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-profile')
  @ApiOperation({ summary: 'Update logged-in user\'s profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 409, description: 'Username or email already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = (req.user as any)?.id || (req.user as any)?.sub;
    return this.authService.updateProfile(userId, dto);
  }

  @Public()
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Send a password reset email' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
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
}
