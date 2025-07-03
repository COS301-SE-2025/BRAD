import { Controller, Get, Param, Post } from '@nestjs/common';
import { WowService } from './wow.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Optional & Wow Features')
@Controller('wow_features')
export class WowController {
  constructor(private readonly wowService: WowService) {}

  @Get('sandbox/run/:reportId')
  @ApiOperation({ summary: 'Run domain in live sandbox' })
  @ApiParam({ name: 'reportId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Sandbox analysis started' })
  runInSandbox(@Param('reportId') reportId: string) {
    return this.wowService.runInSandbox(reportId);
  }

  @Get('blockchain/verify/:reportId')
  @ApiOperation({ summary: 'Get blockchain-verifiable record of report' })
  @ApiParam({ name: 'reportId', description: 'ID of the report' })
  async verifyOnBlockchain(@Param('reportId') reportId: string) {
    return this.wowService.getBlockchainRecord(reportId);
  }

  @Post('registar/takedown/:reportId')
  @ApiOperation({ summary: 'Generate registrar takedown request' })
  @ApiParam({ name: 'reportId', description: 'ID of the report to use' })
  async generateTakedownRequest(@Param('reportId') reportId: string) {
    return this.wowService.generateRegistrarTakedown(reportId);
  }

  @Get('tor/lookup/:domain')
  @ApiOperation({ summary: 'Check domain presence in dark web/Tor sites' })
  @ApiParam({ name: 'domain', description: 'Domain to check' })
  async lookupTorPresence(@Param('domain') domain: string) {
    return this.wowService.checkTorPresence(domain);
  }
}
