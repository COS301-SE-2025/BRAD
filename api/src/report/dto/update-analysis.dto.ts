import {
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

enum AnalysisStatus {
  Pending = 'pending',
  Done = 'done',
  Failed = 'failed'
}

class RedFlagsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suspiciousJS?: string[];

  @IsOptional()
  @IsBoolean()
  obfuscatedScripts?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirectChain?: string[];

  @IsOptional()
  @IsBoolean()
  usesMetaRefresh?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suspiciousInlineEvents?: string[];

  @IsOptional()
  @IsBoolean()
  captchaDetected?: boolean;
}

class StructuredInfoDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  headings?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  links?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forms?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RedFlagsDto)
  redFlags?: RedFlagsDto;
}

class ScrapingInfoDto {
  @IsOptional()
  @IsString()
  htmlRaw?: string;

  @IsOptional()
  @IsString()
  screenshotPath?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StructuredInfoDto)
  structuredInfo?: StructuredInfoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crawledLinks?: string[];
}

class ForensicsStatsDto {
  @IsOptional()
  @IsNumber()
  domain_age_days?: number;

  @IsOptional()
  @IsString()
  domain_created?: string;

  @IsOptional()
  @IsNumber()
  ssl_days_remaining?: number;

  @IsOptional()
  @IsObject()
  dns?: {
    mx_count?: number;
    ns_count?: number;
    has_spf?: boolean;
    has_dmarc?: boolean;
  };
}

class AnalysisDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  reverseIp?: string;

  @IsOptional()
  @IsObject()
  whoisRaw?: Record<string, any>;

  @IsOptional()
  @IsString()
  registrar?: string;

  @IsOptional()
  @IsString()
  whoisOwner?: string;

  @IsOptional()
  @IsBoolean()
  sslValid?: boolean;

  @IsOptional()
  @IsString()
  sslExpires?: string;

  @IsOptional()
  @IsObject()
  dns?: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ForensicsStatsDto)
  stats?: ForensicsStatsDto;

  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsObject()
  riskReasons?: Record<string, string>;

  @IsOptional()
  @IsObject()
  geo?: Record<string, any>;

  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class UpdateAnalysisDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisDto)
  analysis?: AnalysisDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapingInfoDto)
  scrapingInfo?: ScrapingInfoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RedFlagsDto)
  abuseFlags?: RedFlagsDto;

  @IsEnum(AnalysisStatus)
  analysisStatus: AnalysisStatus;
}
