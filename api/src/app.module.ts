import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import * as Joi from 'joi';
import { AdminModule } from './admin/admin.module';
import { StatisticsModule } from './statistics/statistics.module';
import { HttpModule } from '@nestjs/axios';
import { QueueModule } from './queue/queue.module'; // your FastAPI wrapper
import { DomainSimilarityService } from './domain-similarity/domain-similarity.service';
import { DomainSimilarityModule } from './domain-similarity/domain-similarity.module';


@Module({
  imports: [
    // Load & validate environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        BOT_ACCESS_KEY: Joi.string().required(),
        FASTAPI_URL: Joi.string().required(), 
      }),
    }),

    // JWT auth
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    // HTTP client for FastAPI communication
    HttpModule,

    // Modules
    QueueModule,        
    ReportModule,
    AuthModule,
    AdminModule,
    StatisticsModule,
    DomainSimilarityModule,
  ],

  controllers: [AppController],
  providers: [AppService, DomainSimilarityService],
})
export class AppModule {}
