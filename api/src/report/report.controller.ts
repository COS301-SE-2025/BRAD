import {
    UploadedFile,UploadedFiles,
  UseInterceptors, Controller, Post, Get, Param, Patch, Body, HttpCode, NotFoundException, BadRequestException, UnauthorizedException, UseGuards, Req, ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportService } from './report.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { BotGuard } from '../auth/guards/bot.guard';
import { FileInterceptor,FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam,ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import Multer from 'multer';
import { extname } from 'path';


@ApiTags('Reports')
@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('general', 'admin')
  @Post('report')
  @UseInterceptors(FilesInterceptor('evidence',5,{
    storage: diskStorage({
     destination: path.join(__dirname, '..', '..','uploads', 'evidence'),

      
      // Ensure the uploads directory exists

      filename: (req, file, cb) => {
       
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
     
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a suspicious domain with optional screenshot evidence' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
        evidence: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Report submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing domain or user ID' })
  async submit(
    @Req() req: Request,
    @Body('domain') domain: string,
    @UploadedFiles() files?: Multer.File[] | Multer.File,
  ) {
    const user = req['user'] as JwtPayload;
    const userId = user?.id;

    if (!domain || !userId) {
      throw new BadRequestException('Domain and authenticated user ID are required');
    }

    // Optional: evidence filename
    const evidencePaths = files?.map(file => file.filename) || [];

    return this.reportService.submitReport(domain, userId, evidencePaths);
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
    analysis: body.analysis,               // full ForensicReport dict
    scrapingInfo: body.scrapingInfo,       // from perform_scraping
    abuseFlags: body.abuseFlags,           // flags found during scraping
    analysisStatus: body.analysisStatus,   // "done"/"error"
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
}
