import { Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema }
    ]),
  ],
  controllers: [DomainController],
  providers: [DomainService],
})
export class DomainModule {}
