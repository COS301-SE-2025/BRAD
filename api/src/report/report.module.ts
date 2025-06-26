import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportSchema } from '../schemas/report.schema';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ForensicService } from '../services/forensic.service';
import { UserModule } from '../users/user.module'; 
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Report', schema: ReportSchema }]),
    UserModule,
    AuthModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ForensicService],
})
export class ReportModule {}