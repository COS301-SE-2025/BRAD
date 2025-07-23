import {UseGuards, Controller, Get, Req} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth} from '@nestjs/swagger';

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

    @Get('timeline')
    @ApiOperation({ summary: 'Timeline of reports/analysis' })
    @ApiResponse({ status: 200, description: 'Chronological list of reports with timestamps' })
    async getReportTimeline() {
        return this.dashboardService.getReportTimeline();
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('investigator')
    @Get('dashboard/reports')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Investigator-specific filtered reports' })
    @ApiResponse({ status: 200, description: 'Filtered reports for investigator' })
    async getInvestigatorReports(@Req() req: Request) {
        const user = req['user'] as JwtPayload;
        return this.dashboardService.getInvestigatorReports(user.id);
    }

    @Get('open-cases/count')
    @ApiOperation({ summary: 'Get number of open cases' })
    @ApiResponse({ status: 200, description: 'Number of open cases returned successfully' })
    async getOpenCasesCount(): Promise<{ openCases: number }> {
        const count = await this.dashboardService.getOpenCasesCount();
        return { openCases: count };
    }
}
