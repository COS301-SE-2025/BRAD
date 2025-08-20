// report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @ApiProperty({ example: 'phishing-portal.com' })
  @Prop({ required: true, trim: true })
  domain: string;

  @ApiProperty({
    description: 'Optional screenshot or file evidence',
    example: ['uploads/evidence/file1.png', 'uploads/evidence/file2.png'],
    required: false,
    type: [String],
  })
  @Prop({ type: [String], default: [] })
  evidence: string[];

  @ApiProperty({ example: '665c861c8b23919a3f823fa1', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @ApiProperty({ example: '665c861c8b23919a3f823fa1', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @ApiProperty({ example: false, default: false })
  @Prop({ default: false })
  analyzed: boolean;

  @ApiProperty({
    description: 'Full forensic analysis result (ForensicReport.to_dict())',
    type: Object,
    nullable: true,
  })
  @Prop({ type: Object, default: null })
  analysis: Record<string, any> | null;

  // ── NEW shape for recursive crawler ───────────────────────────────────────────
  @Prop({ type: Object, default: null })
  scrapingInfo?: {
    scan?: {
      startUrl?: string;
      submittedAt?: string;   // ISO
      userAgent?: string;
      maxPages?: number;
      maxDepth?: number;
      delaySeconds?: number;
      obeyRobots?: boolean;
    };
    summary?: {
      pagesCrawled?: number;
      pagesFlagged?: number;
      requestsSampled?: number;
    };
    network?: {
      requests?: Array<{
        url: string;
        method: string;
        resourceType?: string;
      }>;
    };
    pages?: Array<{
      url: string;
      title: string;
      htmlHash: string;
      screenshotPath?: string;
      structuredInfo?: {
        headings?: string[];
        links?: string[];
        forms?: string[];
      };
      flags?: {
        suspiciousJS?: string[];
        obfuscatedScripts?: boolean;
        usesMetaRefresh?: boolean;
        suspiciousInlineEvents?: Array<Record<string, string>>;
        redirectChain?: string[];
        keywordMatches?: number;
        malwareDetected?: boolean;
      };
      riskScore?: number;
    }>;
    screenshots?: string[];
  } | null;

  @Prop({ type: Object, default: null })
  abuseFlags?: {
    pagesFlagged?: string[]; // URLs meeting risk threshold
    redirectChains?: Record<string, string[]>; // startURL -> chain[]
    globalSuspicion?: {
      anyObfuscation?: boolean;
      anyMetaRefresh?: boolean;
      totalSuspiciousJS?: number;
      totalKeywordMatches?: number;
    };
  } | null;

  @Prop()
  riskScore?: number; // overall (optional)

  // ── Unify statuses across backend & bot ──────────────────────────────────────
  @ApiProperty({ enum: ['bot','pending','in-progress','done','error'], default: 'bot' })
  @Prop({ enum: ['bot','pending','in-progress','done','error'], default: 'bot' })
  analysisStatus: 'bot' | 'pending' | 'in-progress' | 'done' | 'error';

  @ApiProperty({ enum: ['malicious', 'benign', null], nullable: true })
  @Prop({ type: String, enum: ['malicious', 'benign', null], default: null })
  investigatorDecision: 'malicious' | 'benign' | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
