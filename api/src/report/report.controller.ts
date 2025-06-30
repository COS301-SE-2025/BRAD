import {
    Controller, Post, Get, Param, Patch, Body, HttpCode, NotFoundException, BadRequestException, UnauthorizedException, UseGuards, Req, ForbiddenException, UploadedFiles, UseInterceptors} from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ReportService } from './report.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { BotGuard } from '../auth/guards/bot.guard';

import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes 
} from '@nestjs/swagger';

@ApiTags('Reports')
@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('general', 'admin')
  @Post('report')
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: 'Submit a suspicious domain' })
  @ApiBody({ schema: { type: 'object', properties: { domain: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Report submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing domain or user ID' })
  async submit(@Req() req: Request, @Body('domain') domain: string) {
    const user = req['user'] as JwtPayload;
    const userId = user?.id;

    if (!domain || !userId) {
      throw new BadRequestException('Domain and authenticated user ID are required');
    }

    return this.reportService.submitReport(domain, userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'investigator', 'general')
  @Get('reports')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reports submitted by user or all (admin/investigator)' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  async getReports(@Req() req: Request) {
    const user = req['user'] as JwtPayload;
    const userId = user?.id;
    const role = user?.role;

    return this.reportService.getReports(userId, role);
  }

  @UseGuards(BotGuard)
  @Get('pending-reports')
  //@ApiBearerAuth() // Bot Access Key
  @ApiOperation({ summary: 'Get a pending report for bot analysis' })
  @ApiResponse({ status: 200, description: 'Pending report' })
  @ApiResponse({ status: 404, description: 'No pending reports' })
  async getPending() {
    const report = await this.reportService.getPendingReport();
    if (!report) throw new NotFoundException('No pending reports');
    return report;
  }

  @UseGuards(BotGuard)
  @Patch('reports/:id/analysis')
  async updateAnalysis(@Param('id') id: string, @Body() body: any) {
    return this.reportService.updateAnalysis(id, {
      analysis: body.analysis,
      scrapingInfo: body.scrapingInfo,
      riskScore: body.analysis?.riskScore,
      whois: body.analysis?.whois || body.whois,
      analysisStatus: body.analysisStatus,
    });
  }
  
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('investigator')
  @Patch('report/:id/decision')
  @ApiBearerAuth() // JWT
  @ApiOperation({ summary: 'Investigator submits decision (malicious/benign)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['malicious', 'benign'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Decision updated' })
  async updateDecision(@Param('id') id: string, @Body('verdict') verdict: string) {
    return this.reportService.updateInvestigatorDecision(id, verdict);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'investigator')
  @Get('forensics/:id')
  @ApiBearerAuth() // JWT
  @ApiOperation({ summary: 'Perform a forensic analysis on a report' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Analysis result' })
  async analyze(@Param('id') id: string) {
    return this.reportService.analyzeReport(id);
  }

  @UseGuards(BotGuard)
  @Get('bot-test')
  @ApiBearerAuth() // Bot Access Key
  @ApiOperation({ summary: 'Test endpoint for bot authentication' })
  @ApiResponse({ status: 200, description: 'Bot authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized bot' })
  getBotTest(@Req() req: Request) {
    if (!req['bot']) throw new UnauthorizedException('No bot credentials found');
    return { success: true, bot: req['bot'] };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('general', 'admin')
  @Post('reports/:id/evidence')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/evidence',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach files/screenshots to a report' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        description: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  async uploadEvidence(
    @Param('id') reportId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('description') description: string,
  ) {
    return this.reportService.attachEvidence(reportId, files, description);
  }

}
