import { Controller, Get, Param } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Forensic & Metadata Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

    @Get('whois/:domain')
    @ApiOperation({ summary: 'Perform WHOIS lookup' })
    @ApiParam({ name: 'domain', description: 'The domain to lookup' })
    @ApiResponse({ status: 200, description: 'WHOIS data retrieved' })
    @ApiResponse({ status: 404, description: 'Domain not found or WHOIS failed' })
    async getWhois(@Param('domain') domain: string) {
        return this.toolsService.performWhoisLookup(domain);
    }

    @Get('reverse-dns/:ip')
    @ApiOperation({ summary: 'Perform reverse DNS lookup' })
    @ApiParam({ name: 'ip', description: 'The IP address to reverse lookup' })
    @ApiResponse({ status: 200, description: 'Reverse DNS data retrieved' })
    @ApiResponse({ status: 404, description: 'No reverse DNS found' })
    async reverseDnsLookup(@Param('ip') ip: string) {
    return this.toolsService.performReverseDns(ip);
    }

}
