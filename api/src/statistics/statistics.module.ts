import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { ReportModule } from 'src/report/report.module';
import { UserModule } from 'src/users/user.module';

@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  imports: [ReportModule, UserModule]
})
export class StatisticsModule {}
