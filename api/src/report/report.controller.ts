import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Body,
  HttpCode,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportService } from './report.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { BotGuard } from '../auth/guards/bot.guard';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Reports')
@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('general', 'admin')
  @Post('report')
  @ApiBearerAuth() // JWT
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
  @ApiBearerAuth() // JWT
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
  @ApiBearerAuth() // Bot Access Key
  @ApiOperation({ summary: 'Get a pending report for bot analysis' })
  @ApiResponse({ status: 200, description: 'Pending report' })
  @ApiResponse({ status: 404, description: 'No pending reports' })
  async getPending() {
    const report = await this.reportService.getPendingReport();
    if (!report) throw new NotFoundException('No pending reports');
    return report;
  }

  @UseGuards(BotGuard)
  @Post('analyzed-report')
  @HttpCode(200)
  @ApiBearerAuth() // Bot Access Key
  @ApiOperation({ summary: 'Bot submits analysis result' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        analysis: { type: 'object' },
      },
      required: ['id', 'analysis'],
    },
  })
  @ApiResponse({ status: 200, description: 'Analysis saved' })
  @ApiResponse({ status: 400, description: 'Missing report id or analysis' })
  async saveAnalysis(@Body() body: { id: string; analysis: any }) {
    if (!body.id || !body.analysis)
      throw new BadRequestException('Missing report id or analysis');
    return this.reportService.saveAnalysis(body.id, body.analysis);
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
}
