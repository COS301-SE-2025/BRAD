import { Controller, Get, Req, UseGuards, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './reports_history.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

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
}
