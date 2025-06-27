import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Request } from 'express';
  
  @Injectable()
  export class BotGuard implements CanActivate {
    private readonly logger = new Logger(BotGuard.name);
    private readonly botKey: string;
  
    constructor(private configService: ConfigService) {
      this.botKey = this.configService.get<string>('BOT_ACCESS_KEY') || '';
      if (!this.botKey) {
        console.log('BOT_ACCESS_KEY is not defined in .env');
      }
    }
  
    canActivate(context: ExecutionContext): boolean {
      const req: Request = context.switchToHttp().getRequest();
      const authHeader = req.headers['authorization'];
  
      //console.log(`Incoming header: ${authHeader}`);
  
      if (!authHeader || !authHeader.startsWith('Bot ')) {
        throw new UnauthorizedException('Bot token missing or malformed');
      }
  
      const token = authHeader.replace('Bot ', '').trim();
  
      if (token !== this.botKey) {
        console.log('Invalid bot token received');
        throw new UnauthorizedException('Invalid Bot Access Key');
      }
  
      req['bot'] = { authorized: true }; // Optionally assign metadata
      return true;
    }
  }
  