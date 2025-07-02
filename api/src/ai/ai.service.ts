import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';

@Injectable()
export class AiService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {}

  //might change
    async analyzeReportWithAI(reportId: string): Promise<any> {
        const report = await this.reportModel.findById(reportId);

        if (!report || !report.analysis || !report.scrapingInfo) {
            throw new NotFoundException('Report not found or missing data');
        }

        // Extract useful fields for risk assessment
        const { analysis, scrapingInfo, abuseFlags } = report;

        let riskScore = 0;

        // Heuristics for basic AI-like scoring logic

        // 1. If malware is detected
        if (analysis.malwareDetected) {
            riskScore += 0.4;
        }

        // 2. Suspicious WHOIS
        if (!analysis.whoisOwner || (typeof analysis.whoisOwner === 'string' && analysis.whoisOwner.toLowerCase().includes('redacted'))) {
            riskScore += 0.1;
        }

        // 3. SSL not valid
        if (analysis.sslValid === false) {
            riskScore += 0.1;
        }

        // 4. DNS anomalies
        if (!analysis.dns?.MX || analysis.dns.MX.length === 0) {
            riskScore += 0.1;
        }

        // 5. Suspicious JS or obfuscated scripts
        if (abuseFlags?.suspiciousJS?.length) {
            riskScore += 0.1;
        }
        if (abuseFlags?.obfuscatedScripts) {
            riskScore += 0.1;
        }

        // 6. Meta refresh or redirection
        if (abuseFlags?.usesMetaRefresh || abuseFlags?.redirectChain?.length) {
            riskScore += 0.1;
        }

        // 7. CAPTCHA or form manipulation
        if (abuseFlags?.captchaDetected || (scrapingInfo.structuredInfo?.forms?.length ?? 0) > 3){

            riskScore += 0.1;
        }

        // Clamp score between 0 and 1
        const finalScore = Math.min(riskScore, 1.0);

        // Store the score in the analysis object
        report.analysis.aiRiskScore = finalScore;

        await report.save();

        return {
            reportId,
            aiRiskScore: finalScore,
            summary: 'AI-based risk scoring complete',
            hints: {
            malwareDetected: analysis.malwareDetected,
            missingWhoisOwner: !analysis.whoisOwner,
            sslValid: analysis.sslValid,
            suspiciousJSCount: abuseFlags?.suspiciousJS?.length || 0,
            obfuscated: abuseFlags?.obfuscatedScripts || false,
            },
        };
    }

    async getAiRiskScore(reportId: string): Promise<any> {
        const report = await this.reportModel.findById(reportId).lean();

        if (!report || !report.analysis?.aiRiskScore) {
        throw new NotFoundException('AI risk score not found for this report');
        }

        const score = report.analysis.aiRiskScore;

        const classification =
        score > 0.75 ? 'High' :
        score > 0.4 ? 'Medium' :
        'Low';

        return {
        reportId,
        aiRiskScore: score,
        classification,
        };
    }

}
