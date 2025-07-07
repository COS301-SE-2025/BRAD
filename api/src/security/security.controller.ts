import { Controller, Get, Param, UseGuards, Req, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Security & Auditing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('logs')
  @ApiOperation({ summary: 'View immutable system logs' })
  getSystemLogs() {
    return this.securityService.getSystemLogs();
  }

  @Get('audit/:userId')
  @ApiOperation({ summary: 'Audit trail of actions by a specific user' })
  @ApiParam({ name: 'userId', type: String })
  getAuditTrail(@Param('userId') userId: string) {
    return this.securityService.getAuditTrailByUser(userId);
  }

  @Post('2fa/setup')
  @ApiOperation({ summary: 'Setup Multi-Factor Authentication' })
  async setup2FA(@Req() req: Request) {
    //const userId = req['user']?.sub || req['user']?._id;
    const user = req['user'] as { sub?: string; _id?: string };
    const userId = user.sub || user._id;

    if (!userId) {
        throw new UnauthorizedException('User ID not found in request');
    }
    return this.securityService.generate2FA(userId);
  }

  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA code during login' })
  async verify2FA(@Body() body: { userId: string; token: string }) {
    const { userId, token } = body;

    if (!userId || !token) {
        throw new BadRequestException('userId and token are required');
    }

    const isValid = await this.securityService.verify2FA(userId, token);

    if (!isValid) {
        throw new UnauthorizedException('Invalid or expired 2FA code');
    }

    return { success: true, message: '2FA verification successful' };
  }
}
