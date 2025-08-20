// update-analysis.dto.ts
import {
  IsOptional, IsString, IsNumber, ValidateNested, IsBoolean,
  IsArray, IsObject, IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Unify enum with schema (add 'bot','in-progress','error') ──
export enum AnalysisStatusUnified {
  Bot = 'bot',
  Pending = 'pending',
  InProgress = 'in-progress',
  Done = 'done',
  Error = 'error',
}

/* ---------- Network ---------- */
class NetworkRequestDto {
  @IsString() url: string;
  @IsString() method: string;
  @IsOptional() @IsString() resourceType?: string;
}

class NetworkDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetworkRequestDto)
  requests?: NetworkRequestDto[];
}

/* ---------- Scan & Summary ---------- */
class ScanDto {
  @IsOptional() @IsString() startUrl?: string;
  @IsOptional() @IsString() submittedAt?: string;
  @IsOptional() @IsString() userAgent?: string;
  @IsOptional() @IsNumber() maxPages?: number;
  @IsOptional() @IsNumber() maxDepth?: number;
  @IsOptional() @IsNumber() delaySeconds?: number;
  @IsOptional() @IsBoolean() obeyRobots?: boolean;
}

class SummaryDto {
  @IsOptional() @IsNumber() pagesCrawled?: number;
  @IsOptional() @IsNumber() pagesFlagged?: number;
  @IsOptional() @IsNumber() requestsSampled?: number;
}

/* ---------- Page Flags ---------- */
class PageFlagsDto {
  @IsOptional() @IsArray() @IsString({ each: true }) suspiciousJS?: string[];
  @IsOptional() @IsBoolean() obfuscatedScripts?: boolean;
  @IsOptional() @IsBoolean() usesMetaRefresh?: boolean;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  suspiciousInlineEvents?: Array<Record<string, string>>;

  @IsOptional() @IsArray() @IsString({ each: true }) redirectChain?: string[];
  @IsOptional() @IsNumber() keywordMatches?: number;
  @IsOptional() @IsBoolean() malwareDetected?: boolean;
}

/* ---------- Structured Info ---------- */
class StructuredInfoDto {
  @IsOptional() @IsArray() @IsString({ each: true }) headings?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) links?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) forms?: string[];
}

/* ---------- Page ---------- */
class PageDto {
  @IsString() url: string;
  @IsString() title: string;
  @IsString() htmlHash: string;

  @IsOptional() @IsString() screenshotPath?: string;

  @IsOptional() @ValidateNested() @Type(() => StructuredInfoDto)
  structuredInfo?: StructuredInfoDto;

  @IsOptional() @ValidateNested() @Type(() => PageFlagsDto)
  flags?: PageFlagsDto;

  @IsOptional() @IsNumber() riskScore?: number;
}

/* ---------- ScrapingInfo (top level) ---------- */
class ScrapingInfoDto {
  @IsOptional() @ValidateNested() @Type(() => ScanDto) scan?: ScanDto;
  @IsOptional() @ValidateNested() @Type(() => SummaryDto) summary?: SummaryDto;
  @IsOptional() @ValidateNested() @Type(() => NetworkDto) network?: NetworkDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageDto)
  pages?: PageDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshots?: string[];
}

/* ---------- AbuseFlags (aggregate) ---------- */
class GlobalSuspicionDto {
  @IsOptional() @IsBoolean() anyObfuscation?: boolean;
  @IsOptional() @IsBoolean() anyMetaRefresh?: boolean;
  @IsOptional() @IsNumber() totalSuspiciousJS?: number;
  @IsOptional() @IsNumber() totalKeywordMatches?: number;
}

class AbuseFlagsDto {
  @IsOptional() @IsArray() @IsString({ each: true }) pagesFlagged?: string[];

  // startURL -> chain[]
  @IsOptional() @IsObject()
  redirectChains?: Record<string, string[]>;

  @IsOptional() @ValidateNested() @Type(() => GlobalSuspicionDto)
  globalSuspicion?: GlobalSuspicionDto;
}

/* ---------- Forensics (existing) ---------- */
class ForensicsStatsDto {
  @IsOptional() @IsNumber() domain_age_days?: number;
  @IsOptional() @IsString() domain_created?: string;
  @IsOptional() @IsNumber() ssl_days_remaining?: number;
  @IsOptional() @IsObject() dns?: {
    mx_count?: number; ns_count?: number; has_spf?: boolean; has_dmarc?: boolean;
  };
}

class AnalysisDto {
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsString() ip?: string;
  @IsOptional() @IsString() reverseIp?: string;
  @IsOptional() @IsObject() whoisRaw?: Record<string, any>;
  @IsOptional() @IsString() registrar?: string;
  @IsOptional() @IsString() whoisOwner?: string;
  @IsOptional() @IsBoolean() sslValid?: boolean;
  @IsOptional() @IsString() sslExpires?: string;
  @IsOptional() @IsObject() dns?: Record<string, any>;
  @IsOptional() @ValidateNested() @Type(() => ForensicsStatsDto) stats?: ForensicsStatsDto;
  @IsOptional() @IsNumber() riskScore?: number;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsObject() riskReasons?: Record<string, string>;
  @IsOptional() @IsObject() geo?: Record<string, any>;
  @IsOptional() @IsString() timestamp?: string;
}

/* ---------- UpdateAnalysis DTO ---------- */
export class UpdateAnalysisDto {
  @IsOptional() @ValidateNested() @Type(() => AnalysisDto)
  analysis?: AnalysisDto;

  @IsOptional() @ValidateNested() @Type(() => ScrapingInfoDto)
  scrapingInfo?: ScrapingInfoDto;

  @IsOptional() @ValidateNested() @Type(() => AbuseFlagsDto)
  abuseFlags?: AbuseFlagsDto;

  @IsEnum(AnalysisStatusUnified)
  analysisStatus: AnalysisStatusUnified;
}
