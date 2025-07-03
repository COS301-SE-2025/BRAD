import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Investigator Dashboard Tools')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

    @Get('overview')
    @ApiOperation({ summary: 'High-level statistics (total reports, threats, categories)' })
    @ApiResponse({ status: 200, description: 'Dashboard overview data' })
    async getOverview() {
        return this.dashboardService.getOverview();
    }

    @Get('alerts')
    @ApiOperation({ summary: 'High-risk alerts and flagged domains' })
    @ApiResponse({ status: 200, description: 'List of high-risk reports' })
    async getHighRiskAlerts() {
        return this.dashboardService.getHighRiskAlerts();
    }

}
