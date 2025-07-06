import { Controller, Get, Req, Res, Query, UseGuards, NotFoundException, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './reports_history.service';
//import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request, Response } from 'express';

@ApiTags('Reports & History')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'View past reports and outcomes' })
  async getUserReportHistory(@Req() req: Request) {
    //const userId = req['user']._id || req['user'].sub;
    const user = req['user'];
    const userId = user?.['_id'] || user?.['sub'];

    if (!userId) {
        throw new UnauthorizedException('User ID not found in request');
    }

    return this.historyService.getReportHistory(userId);
  }

  @Get(':userId')
  @Roles('investigator')
  @ApiOperation({ summary: 'Investigator: View report history by user' })
  @ApiParam({ name: 'userId', type: String })
  getUserHistory(@Param('userId') userId: string) {
    return this.historyService.getReportHistoryByUser(userId);
  }

  @Get('export/:reportId')
  @ApiOperation({ summary: 'Download report in PDF or CSV' })
  @ApiParam({ name: 'reportId', type: String })
  @ApiQuery({ name: 'format', enum: ['pdf', 'csv'], required: true })
  async exportReport(
    @Param('reportId') reportId: string,
    @Query('format') format: 'pdf' | 'csv',
    @Res({ passthrough: false }) res: Response,
  ) {
    const buffer = await this.historyService.exportReport(reportId, format);
    if (!buffer) throw new NotFoundException('Report not found');

    const contentType =
      format === 'pdf' ? 'application/pdf' : 'text/csv';
    const fileName = `report-${reportId}.${format}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);
  }

  @Get('/analytics/domain-history/:domain')
  @ApiOperation({ summary: 'Get historical abuse data for a domain' })
  @ApiParam({ name: 'domain', type: String })
  async getDomainHistory(@Param('domain') domain: string) {
    return this.historyService.getDomainAbuseHistory(domain);
  }

}
