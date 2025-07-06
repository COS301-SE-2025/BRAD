import { Module } from '@nestjs/common';
import { HistoryController } from './reports_history.controller';
import { HistoryService } from './reports_history.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
