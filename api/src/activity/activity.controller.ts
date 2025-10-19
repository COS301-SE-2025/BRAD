import { Controller, Post, Patch, Body, Param, UseGuards, Req, Get } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

@UseGuards(AuthGuard)
@Get('my-activities')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get activity logs for the current user' })
@ApiResponse({ status: 200, description: 'List of user activities' })
async getMyActivities(@Req() req) {
  const user = req['user'] as JwtPayload;
  return this.activityService.getUserActivity(user.id);
}

}
