import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

async function bootstrap() {
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
