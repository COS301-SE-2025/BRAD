import {
    IsBoolean,
    IsOptional,
    IsString,
    IsNumber,
    IsDateString,
    IsObject,
  } from 'class-validator';
  
  export class AnalysisDto {
    @IsString()
    domain: string;
  
    @IsDateString()
    scannedAt: string;
  
    @IsString()
    title: string;
  
    @IsBoolean()
    malwareDetected: boolean;
  
    @IsString()
    summary: string;
  
    @IsString()
    ip: string;
  
    @IsString()
    registrar: string;
  
    @IsString()
    whoisOwner: string;
  
    @IsBoolean()
    sslValid: boolean;
  
    @IsString()
    sslExpires: string;
  
    @IsNumber()
    riskScore: number;
  
    @IsOptional()
    @IsObject()
    whoisRaw?: Record<string, any>;

    @IsOptional()
    @IsString()
    reverseIp?: string| string[];;

    @IsOptional()
    dns?: {
    MX?: string[];
    NS?: string[];
    TXT?: string[];
    };

  }
  