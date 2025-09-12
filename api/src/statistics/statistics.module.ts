import { Module } from '@nestjs/common';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { ReportModule } from 'src/report/report.module';
import { UserModule } from 'src/users/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    MongooseModule.forFeature([]),
    UserModule,
    AuthModule,
    ReportModule, // Add your schemas here if needed
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
 exports: [MongooseModule]
})
export class StatisticsModule {}
