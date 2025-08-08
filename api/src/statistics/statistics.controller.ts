import {
    UploadedFile,UploadedFiles,
  UseInterceptors, Controller, Post, Get, Param, Patch, Body, HttpCode, NotFoundException, BadRequestException, UnauthorizedException, UseGuards, Req, ForbiddenException,
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
    @Get('most-reported-domain')        
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({ summary: 'Get the most reported domain' })
    @ApiResponse({ status: 200, description: 'Most reported domain' })
    async getMostReportedDomain(@Req() req: Request) {
    
        return this.statisticsService.getMostReportedDomain();
    }

    // }
}
