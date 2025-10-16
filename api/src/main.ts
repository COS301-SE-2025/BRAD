import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Body limits & compression (before routes) ---
  app.use(json({ limit: process.env.BODY_LIMIT || '20mb' }));
  app.use(
    urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '20mb' }),
  );
  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('BRAD API')
    .setDescription('Bot to Report Abusive Domains API documentation')
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for user authentication',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'BAK',
        description: 'Bot Access Key (BAK) for bot authentication',
      },
      'BAK-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.enableCors({
    origin: ['http://localhost:5173', 'https://capstone-brad.dns.net.za'],
    credentials: true,
  });

  // Serve /screenshots
  const screenshotsPath =
    process.env.SCREENSHOTS_DIR || join(__dirname, '..', '..', 'screenshots');
  console.log('Serving screenshots from:', screenshotsPath);

  app.use(
    '/static/screenshots',
    express.static(screenshotsPath, {
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  // Serve /uploads
  app.use(
    '/static/uploads',
    express.static(
      join(__dirname, '..', '..', '..', '..', '..', '..', 'uploads'),
      {
        setHeaders: (res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        },
      },
    ),
  );

  await app.listen(3000);
}
console.log('FASTAPI_URL:', process.env.FASTAPI_URL);
bootstrap();
