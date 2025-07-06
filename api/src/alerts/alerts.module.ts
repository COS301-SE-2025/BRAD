import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
