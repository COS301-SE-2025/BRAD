import { Module } from '@nestjs/common';
import { DomainSimilarityController } from './domain-similarity.controller';
import { DomainSimilarityService } from './domain-similarity.service';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema } from 'src/report/schema/report.schema';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Report', schema: ReportSchema }]),
    AuthModule,
  ],
  controllers: [DomainSimilarityController],
  providers: [DomainSimilarityService],
  exports: [DomainSimilarityService],
  })
export class DomainSimilarityModule {}
