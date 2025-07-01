import { NotFoundException, InternalServerErrorException, Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DomainService } from './domain.service';

@ApiTags('Domain Scraping & Bot Analysis')
@Controller('analysis')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Post('start/:reportId')
  @ApiOperation({ summary: 'Start scraping and analysis (invokes bot)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'reportId', description: 'ID of the report to analyze' })
  @ApiResponse({ status: 200, description: 'Analysis started' })
  async startAnalysis(@Param('reportId') reportId: string) {
    return this.domainService.startScrapingAndAnalysis(reportId);
  }

  @Get('status/:reportId')
  @ApiOperation({ summary: 'Check bot analysis progress/status of a report' })
  @ApiParam({ name: 'reportId', type: 'string', description: 'ID of the report' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getAnalysisStatus(@Param('reportId') reportId: string) {
    const result = await this.domainService.getAnalysisStatus(reportId);
    if (!result) throw new NotFoundException('Report not found');
    return result;
  }

  @Get('results/:reportId')
  @ApiOperation({ summary: 'Get scraped content, metadata, and malware check' })
  @ApiParam({ name: 'reportId', type: 'string', description: 'ID of the report' })
  @ApiResponse({ status: 200, description: 'Scraped content and metadata returned' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getAnalysisResults(@Param('reportId') reportId: string) {
    const result = await this.domainService.getAnalysisResults(reportId);
    if (!result) throw new NotFoundException('Report not found');
    return result;
  }
}
