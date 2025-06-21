import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @ApiProperty({
    example: 'phishing-portal.com',
    description: 'The domain being reported for investigation',
  })
  @Prop({ required: true, trim: true })
  domain: string;

  @ApiProperty({
    example: '665c861c8b23919a3f823fa1',
    description: 'The ID of the user who submitted the report',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @ApiProperty({
    example: false,
    description: 'Flag to indicate whether the domain has been analyzed',
    default: false,
  })
  @Prop({ default: false })
  analyzed: boolean;

  @ApiProperty({
    example: { score: 0.85, verdict: 'suspicious' },
    description: 'The analysis result of the domain, if available',
    nullable: true,
  })
  @Prop({ type: Object, default: null })
  analysis: Record<string, any> | null;

  @ApiProperty({
    example: 'malicious',
    enum: ['malicious', 'benign', null],
    description: 'Investigator’s final decision after reviewing the domain',
    nullable: true,
  })
  @Prop({
    type: String,
    enum: ['malicious', 'benign', null],
    default: null,
  })
  investigatorDecision: 'malicious' | 'benign' | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
