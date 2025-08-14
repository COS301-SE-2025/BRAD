import {
    UploadedFile,UploadedFiles,
  UseInterceptors, Controller, Post, Get, Param, Patch, Body, HttpCode, NotFoundException, BadRequestException, UnauthorizedException, UseGuards, Req, ForbiddenException,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { BotGuard } from '../auth/guards/bot.guard';
import { FileInterceptor,FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam,ApiConsumes,
} from '@nestjs/swagger';import { get } from 'http';
;

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {

    constructor(private readonly statisticsService: StatisticsService) {}

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator', 'general')
    @Get('total-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get total reports count or reports submitted by you(general)' })
    @ApiResponse({ status: 200, description: 'Total reports count' })
    async getTotalReports(@Req() req: Request) {
        const user=req['user'] as JwtPayload;
        const userId=user?.id;
        const role=user?.role;
        return this.statisticsService.getTotalReports(userId, role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator', 'general')
    @Get('pending-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get pending reports count or pending reports submitted by you(general)' })
    @ApiResponse({ status: 200, description: 'Pending reports count' })
    async getPendingReports(@Req() req: Request) {
        const user=req['user'] as JwtPayload;
        const userId=user?.id;
        const role=user?.role;
        return this.statisticsService.getPendingReportsCount(userId, role);
    }


    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator', 'general')              
    @Get('analyzed-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get analyzed reports count or analyzed reports submitted by you(general)' })
    @ApiResponse({ status: 200, description: 'Analyzed reports count' })
    async getAnalyzedReports(@Req() req: Request) {
        const user=req['user'] as JwtPayload;
        const userId=user?.id;
        const role=user?.role;
        return this.statisticsService.getAnalyzedReportsCount(userId, role);
    }

  @UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'investigator')
@Get('repeated-domains')
@ApiBearerAuth("JWT-auth")
@ApiOperation({ summary: 'Get all domains reported more than once' })
@ApiResponse({ status: 200, description: 'List of domains reported more than once' })
async getDomainsReportedMoreThanOnce(@Req() req: Request) {
  return this.statisticsService.getDomainsReportedMoreThanOnce();
}


    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator')
    @Get('malicious-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get reports marked as malicious' })
    @ApiResponse({ status: 200, description: 'Reports marked as malicious' })
    async getReportsMarkedAsMalicious(@Req() req: Request) {
        const user=req['user'] as JwtPayload;
       
        const role=user?.role;
        return this.statisticsService.getReportsMarkedAsMalicious(role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator')
    @Get('safe-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get reports marked as safe' })
    @ApiResponse({ status: 200, description: 'Reports marked as safe' })
    async getReportsMarkedAsSafe(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getReportsMarkedAsSafe(role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator')
    @Get('reports-by-month')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get reports by month' })
    @ApiResponse({ status: 200, description: 'Reports by month' })
    async getReportsByMonth(@Req() req: Request, @Query('month') month: number) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getReportCountByMonth(role, month);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator')
    @Get('reports-submitted-today')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get reports submitted today' })
    @ApiResponse({ status: 200, description: 'Reports submitted today' })
    async getReportsSubmittedToday(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getReportSubmittedToday(role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('no-of-investigators')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get number of investigators' })
    @ApiResponse({ status: 200, description: 'Number of investigators' })
    async getNoOfInvestigators(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getNoOfInvestigators(role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('no-of-admins')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get number of admins' })
    @ApiResponse({ status: 200, description: 'Number of admins' })
    async getNoOfAdmins(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getNoOfAdmins(role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('no-of-general-users')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get number of general users' })
    @ApiResponse({ status: 200, description: 'Number of general users' })
    async getNoOfGeneralUsers(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getNoOfGeneralUsers(role);
    }


    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator','general')
    @Get('in-progress-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get in-progress reports count' })
    @ApiResponse({ status: 200, description: 'In-progress reports count' })
    async getInProgressReportsCount(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getInProgressReportsCount(user.id, role);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin', 'investigator','general')
    @Get('resolved-reports')
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get resolved reports count' })
    @ApiResponse({ status: 200, description: 'Resolved reports count' })
    async getResolvedReportsCount(@Req() req: Request) {
        const user=req['user'] as JwtPayload;

        const role=user?.role;
        return this.statisticsService.getResolvedReportsCount(user.id, role);
    }
}
