import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SecurityService } from './security.service';

@ApiTags('Security & Auditing')
@Controller('logs')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  @ApiOperation({ summary: 'View immutable system logs' })
  getSystemLogs() {
    return this.securityService.getSystemLogs();
  }
}
