import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const server: Express = express();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function createNestServer(expressInstance: Express): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  app.enableCors({
    origin: '*',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('BitCommerce API Documentation')
    .setDescription('Enterprise Multi-Tenant eCommerce SaaS API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.init();
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!isInitialized) {
      if (!initPromise) {
        initPromise = createNestServer(server);
      }
      await initPromise;
      isInitialized = true;
    }
    return server(req, res);
  } catch (error: any) {
    console.error('NestJS Serverless Boot Error:', error);
    initPromise = null;
    isInitialized = false;
    return res.status(500).json({
      statusCode: 500,
      message: 'Serverless Application Bootstrap Failed',
      error: error?.message || String(error),
      details: error?.stack || null,
      tip: 'Check your Vercel Environment Variables (DATABASE_URL, JWT_SECRET, etc.) and database connection.',
    });
  }
}
