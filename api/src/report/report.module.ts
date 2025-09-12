import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema } from './schema/report.schema';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ForensicService } from '../services/forensic.service';
import { UserModule } from '../users/user.module'; 
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';

import { StatisticsService } from 'src/statistics/statistics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Report', schema: ReportSchema }]),
    UserModule,
    AuthModule,
    QueueModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ForensicService],
    exports: [MongooseModule]
})
export class ReportModule {}
