import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class SecurityService {
  private readonly logFilePath = path.join(__dirname, '../../logs/system.log');
  private userSecrets: Map<string, string> = new Map(); // In-memory for demonstration

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

  async generate2FA(userId: string): Promise<{ otpauth_url: string; qrCodeDataURL: string }> {
    const secret = speakeasy.generateSecret({
      name: `BRAD (${userId})`, // Label for the authenticator app
    });

    const otpauth_url = secret.otpauth_url;

    // Handle potential undefined otpauth_url
    if (!otpauth_url) {
      throw new Error('Failed to generate OTPAuth URL');
    }

    const qrCodeDataURL = await qrcode.toDataURL(otpauth_url);

    return {
      otpauth_url,
      qrCodeDataURL,
    };
  }

  async verify2FA(userId: string, token: string): Promise<boolean> {
    const secret = this.userSecrets.get(userId);

    if (!secret) {
        throw new NotFoundException('No 2FA secret found for user');
    }

    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // allow 1 time-step before or after
    });
  }
}
