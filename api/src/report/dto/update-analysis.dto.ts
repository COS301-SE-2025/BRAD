import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateAnalysisDto {
  @IsObject()
  analysis: any;

  @IsOptional()
  @IsObject()
  whois?: any;

  @IsOptional()
  @IsString()
  analysisStatus?: string;
}
