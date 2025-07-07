import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SecurityService {
  private readonly logFilePath = path.join(__dirname, '../../logs/system.log');

  getSystemLogs(): string[] {
    try {
      const data = fs.readFileSync(this.logFilePath, 'utf-8');
      return data.split('\n').filter(line => line.trim().length > 0);
    } catch (err) {
      return ['No logs found or error reading log file.'];
    }
  }

  getAuditTrailByUser(userId: string): string[] {
    try {
      const logs = fs.readFileSync(this.logFilePath, 'utf-8');
      return logs
        .split('\n')
        .filter(line => line.includes(userId))
        .filter(line => line.trim().length > 0);
    } catch (err) {
      return [`No audit trail found for user ${userId} or log file missing.`];
    }
  }
}
