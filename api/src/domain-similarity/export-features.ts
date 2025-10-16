// src/domain-similarity/export-features.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DomainSimilarityService } from './domain-similarity.service';
import { getModelToken } from '@nestjs/mongoose';
import { Report, ReportDocument } from '../report/schema/report.schema';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const reportModel = app.get<Model<ReportDocument>>(getModelToken(Report.name));
  const similarityService = app.get(DomainSimilarityService);

  // fetch only reports with investigatorDecision (malicious/benign)
  const reports = await reportModel.find({
    investigatorDecision: { $in: ['malicious', 'benign'] },
  }).lean();

  const rows: string[] = [];
  // header row
  rows.push([
    "domainA",
    "domainB",
    "dice",
    "levenshteinNorm",
    "lcsRatio",
    "charCosine",
    "tokenJaccard",
    "aLen",
    "bLen",
    "hasDigit",
    "hasHyphen",
    "repeatedChars",
    "label"
  ].join(","));

  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const a = reports[i];
      const b = reports[j];

      const lexical = (similarityService as any).lexicalSimilarity(a.domain, b.domain);
      const pattern = (similarityService as any).patternAnalysis(a.domain, b.domain);

      // map malicious/benign → 1/0
      const label =
        (a.investigatorDecision === 'malicious' || b.investigatorDecision === 'malicious')
          ? 1
          : 0;

      rows.push([
        a.domain,
        b.domain,
        lexical.dice,
        lexical.levenshteinNorm,
        lexical.lcsRatio,
        lexical.charCosine,
        lexical.tokenJaccard,
        lexical.aLen,
        lexical.bLen,
        pattern.hasDigit ? 1 : 0,
        pattern.hasHyphen ? 1 : 0,
        pattern.repeatedChars ? 1 : 0,
        label
      ].join(","));
    }
  }

  // write into domain-api folder
  const outPath = path.join(process.cwd(), "domain-api", "domain_features.csv");
  fs.writeFileSync(outPath, rows.join("\n"));

  console.log(`✅ domain_features.csv generated in domain-api with ${rows.length - 1} rows`);
  await app.close();
}

bootstrap();
