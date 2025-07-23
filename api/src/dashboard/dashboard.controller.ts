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
    @Get('/reports')
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

    @Get('closed-cases/count')
    @ApiOperation({ summary: 'Get number of closed cases' })
    @ApiResponse({ status: 200, description: 'Number of closed cases returned successfully' })
    async getClosedCasesCount(): Promise<{ closedCases: number }> {
    const count = await this.dashboardService.getClosedCasesCount();
        return { closedCases: count };
    }

    @Get('investigator/email')
    @ApiOperation({ summary: 'Get email of the current investigator' })
    @ApiResponse({ status: 200, description: 'Email fetched successfully' })
    @ApiResponse({ status: 404, description: 'Investigator not found' })
    async getInvestigatorEmail(@Req() req: Request) {
        const userId = req['user']?.sub || req['user']?._id;
        return this.dashboardService.getInvestigatorEmail(userId);
    }

    @Get('investigator-username')
    @ApiOperation({ summary: 'Get username of the current investigator' })
    @ApiResponse({ status: 200, description: 'Username retrieved successfully' })
    async getInvestigatorUsername(@Req() req: Request): Promise<{ username: string }> {
        const userId = req['user']?.sub || req['user']?._id;
        return this.dashboardService.getInvestigatorUsername(userId);
    }

    @Get('pending-evidence')
    @ApiOperation({ summary: 'Get count of reports with pending evidence' })
    @ApiResponse({ status: 200, description: 'Number of pending evidence reports' })
    async getPendingEvidenceCount() {
        const count = await this.dashboardService.getPendingEvidenceCount();
        return { pendingEvidenceCount: count };
    }

    @Get('total-cases')
    @ApiOperation({ summary: 'Get total number of cases (open + closed + pending evidence)' })
    @ApiResponse({ status: 200, description: 'Total number of cases' })
        async getTotalCasesCount() {
        const total = await this.dashboardService.getTotalCasesCount();
        return { totalCases: total };
    }

    @Get('profile-picture')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Get current user profile picture' })
    @ApiResponse({ status: 200, description: 'Profile picture URL or base64 string' })
    @ApiBearerAuth()
    async getProfilePicture(@Req() req: Request) {
    const userId = (req as any).user?.userId;
    const profilePicture = await this.dashboardService.getProfilePicture(userId);

    return { profilePicture };
    }


}
