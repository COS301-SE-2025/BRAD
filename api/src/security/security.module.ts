import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../report/schema/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule {}
