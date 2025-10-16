import {
    Body,
    Controller,
    Patch,
    Param,
    Post,
    UseGuards,
    Get,
    Delete,
  } from '@nestjs/common';
  import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam,ApiConsumes,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DomainSimilarityService } from './domain-similarity.service';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('domain-similarity')
@Controller('domain-similarity')
export class DomainSimilarityController {
  constructor(private readonly similarityService: DomainSimilarityService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin','investigator')
  @Post('check')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check similarity of a domain against all submitted reports' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        domain: { type: 'string' },
      },
      required: ['domain'],
    },
  })
  @ApiResponse({ status: 200, description: 'Similarity results' })
  checkSimilarity(@Body('domain') domain: string) {
    return this.similarityService.checkAgainstSubmittedReports(domain);
  }
}