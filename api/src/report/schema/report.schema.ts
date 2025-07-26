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
  example: 'uploads/evidence/9f23f8a2-3947-4ea7-a6fc-8e9304d6a3ce.png',
  required: false,
  nullable: true,
  })
  @Prop({ type: String, required: false, default: null })
  evidence?: string;

  @ApiProperty({ example: '665c861c8b23919a3f823fa1', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @ApiProperty({ example: false, default: false })
  @Prop({ default: false })
  analyzed: boolean;

  @ApiProperty({
    description: 'Analysis metadata',
    nullable: true,
    type: Object,
  })
  @Prop({ type: Object, default: null })
  analysis?: {
    domain?: string;
    scannedAt?: Date | string;
    title?: string;
    malwareDetected?: boolean;
    summary?: string;
    ip?: string;
    registrar?: string;
    whoisOwner?: string;
    whoisRaw?: Record<string, any>;
    sslValid?: boolean;
    sslExpires?: string;
    dns?: {
      MX?: string[];
      NS?: string[];
      TXT?: string[];
    };
    reverseIp?: string | string[];
  };

  @Prop({ type: Object, default: null })
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
  
  @Prop({ type: Object, default: null })
  abuseFlags?: {
    suspiciousJS?: string[];
    obfuscatedScripts?: boolean;
    redirectChain?: string[];
    usesMetaRefresh?: boolean;
    suspiciousInlineEvents?: string[];
    captchaDetected?: boolean;
  };
  
  
  
  
  @Prop()
  riskScore?: number;

  @ApiProperty({ enum: ['pending', 'in-progress', 'done', 'error'], default: 'pending' })
  @Prop({ enum: ['pending', 'in-progress', 'done', 'error'], default: 'pending' })
  analysisStatus: string;

  @ApiProperty({ enum: ['malicious', 'benign', null], nullable: true })
  @Prop({ type: String, enum: ['malicious', 'benign', null], default: null })
  investigatorDecision: 'malicious' | 'benign' | null;

  @ApiProperty({
    description: 'Raw WHOIS data stored as key-value JSON',
    type: Object,
    required: false,
    nullable: true,
  })
  @Prop({ type: Object, default: null })
  whoisRaw?: Record<string, any>;

  @ApiProperty({
    description: 'Reverse IP results — either a single string or list of domains',
    type: [String],
    required: false,
  })
  @Prop({ type: [String], default: undefined }) // allow flexibility
  reverseIp?: string[] | string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
