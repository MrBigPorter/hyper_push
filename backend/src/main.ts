import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // ─── Optional feature warnings (non-blocking) ──
  if (!process.env.CODEPUSH_GITHUB_PAT || !process.env.CODEPUSH_GITHUB_OWNER) {
    console.warn(
      '⚠️  CODEPUSH_GITHUB_PAT/CODEPUSH_GITHUB_OWNER not configured — Hot Fix unavailable',
    );
  }
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY not configured — reCAPTCHA disabled');
  }
  if (!process.env.GRAFANA_AUTH_SECRET) {
    console.warn('⚠️  GRAFANA_AUTH_SECRET not configured — Grafana SSO unavailable');
  }
  if (!process.env.CODEPUSH_DOMAIN) {
    console.warn('⚠️  CODEPUSH_DOMAIN not configured — set the domain for correct download URLs');
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Enable graceful shutdown (SIGTERM/SIGINT) so Prisma $disconnect() fires
  app.enableShutdownHooks();

  // Security: HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  app.setGlobalPrefix('api', { exclude: ['/graphql'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 HyperPush API running on http://localhost:${port}`);
  console.log(`📡 GraphQL playground: http://localhost:${port}/graphql`);
}
bootstrap();
