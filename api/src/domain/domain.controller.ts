import { Controller, Post, Param } from '@nestjs/common';
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
}
