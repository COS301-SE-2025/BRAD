import {
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

class RedFlagsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suspiciousJS?: string[];

  @IsOptional()
  @IsBoolean()
  obfuscatedScripts?: boolean;
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

export class UpdateAnalysisDto {
  @IsOptional()
  analysis?: Record<string, any>;

  @IsOptional()
  scrapingInfo?: {
    htmlRaw?: string;
    screenshotPath?: string;
    structuredInfo?: {
      headings?: string[];
      links?: string[];
      forms?: string[];
    };
    crawledLinks?: string[];
  };

  @IsOptional()
  @IsObject()
  abuseFlags?: {
    suspiciousJS?: string[];
    obfuscatedScripts?: boolean;
    redirectChain?: string[];
    usesMetaRefresh?: boolean;
    suspiciousInlineEvents?: string[];
    captchaDetected?: boolean;
  };

  @IsOptional()
  whois?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsString()
  analysisStatus?: string;
}

