import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WowService } from './wow.service';
import { WowController } from './wow.controller';
import { Report, ReportSchema } from '../report/schema/report.schema'; // Make sure path is correct

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  controllers: [WowController],
  providers: [WowService],
})
export class WowModule {}
