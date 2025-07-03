import { Controller, Get, Param } from '@nestjs/common';
import { WowService } from './wow.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Optional & Wow Features')
@Controller('wow_features')
export class WowController {
  constructor(private readonly wowService: WowService) {}

  @Get('run/:reportId')
  @ApiOperation({ summary: 'Run domain in live sandbox' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Sandbox analysis started' })
  runInSandbox(@Param('reportId') reportId: string) {
    return this.wowService.runInSandbox(reportId);
  }

  @Get('verify/:reportId')
  @ApiOperation({ summary: 'Get blockchain-verifiable record of report' })
  @ApiParam({ name: 'reportId', description: 'ID of the report' })
  async verifyOnBlockchain(@Param('reportId') reportId: string) {
    return this.wowService.getBlockchainRecord(reportId);
  }
}
