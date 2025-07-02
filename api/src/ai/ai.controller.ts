import { Controller, Post, Get, Param, HttpException, NotFoundException , HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI Risk Analysis')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze/:reportId')
  @ApiOperation({ summary: 'Run AI model on collected data' })
  @ApiParam({ name: 'reportId', type: String, required: true })
  @ApiResponse({ status: 200, description: 'AI analysis completed' })
  @ApiResponse({ status: 404, description: 'Report not found or incomplete' })
  async analyze(@Param('reportId') reportId: string) {
    const result = await this.aiService.analyzeReportWithAI(reportId);

    if (!result) {
      throw new HttpException('Analysis failed or report not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get('risk-score/:reportId')
  @ApiOperation({ summary: 'Return AI-generated risk score and classification' })
  @ApiParam({ name: 'reportId', type: String })
  @ApiResponse({ status: 200, description: 'Risk score and classification returned' })
  @ApiResponse({ status: 404, description: 'Report or AI risk score not found' })
  async getAiRiskScore(@Param('reportId') reportId: string) {
    return this.aiService.getAiRiskScore(reportId);
  }

  @Get('similar-domains/:domain')
  @ApiOperation({ summary: 'Get domains with similar patterns' })
  @ApiParam({ name: 'domain', type: String })
  @ApiResponse({ status: 200, description: 'List of similar domains' })
  @ApiResponse({ status: 404, description: 'No similar domains found' })
  async getSimilarDomains(@Param('domain') domain: string) {
    return this.aiService.findSimilarDomains(domain);
  }
}
