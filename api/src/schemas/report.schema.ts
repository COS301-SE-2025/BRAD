import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true })
  domain: string;

  @Prop({ required: true })
  submittedBy: string;

  @Prop({ default: 'pending' })
  analysisStatus: string;

  @Prop()
  analysis: any;

  @Prop()
  scrapingInfo: any;

  @Prop()
  whois: any;

  @Prop()
  riskScore: number;

  @Prop()
  verdict: string;

  @Prop([
    {
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
      description: String,
      uploadedAt: Date,
    },
  ])
  evidence: any[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);
