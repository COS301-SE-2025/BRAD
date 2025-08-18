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
  analysis: Record<string, any>;

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

  @ApiProperty({ enum: ['bot', 'pending', 'in-progress', 'done', 'error'], default: 'bot' })
  @Prop({ enum: ['bot', 'pending', 'in-progress', 'done', 'error'], default: 'bot' })
  analysisStatus: string;

  @ApiProperty({ enum: ['malicious', 'benign', null], nullable: true })
  @Prop({ type: String, enum: ['malicious', 'benign', null], default: null })
  investigatorDecision: 'malicious' | 'benign' | null;

}

export const ReportSchema = SchemaFactory.createForClass(Report);
