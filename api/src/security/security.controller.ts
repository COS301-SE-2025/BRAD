import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SecurityService } from './security.service';

@ApiTags('Security & Auditing')
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
}
