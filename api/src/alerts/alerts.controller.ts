import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Alerts & Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles('investigator')
  @ApiOperation({ summary: 'View all alerts (investigator only)' })
  async getAllAlerts() {
    return this.alertsService.getAllAlerts();
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to domain alerts' })
  async subscribeToAlerts(
    @Body('domain') domain: string,
    @Body('email') email: string,
  ) {
    return this.alertsService.subscribeToAlerts(domain, email);
  }
}
