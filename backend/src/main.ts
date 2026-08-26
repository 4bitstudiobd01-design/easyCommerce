import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // Uploaded product images are served straight from disk at /uploads/**. This is
  // registered before the global API prefix so the URLs stored on product_images
  // resolve without the /api/v1 prefix.
  app.useStaticAssets(process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    index: false,
    // Uploaded files are immutable — a new upload always gets a fresh UUID name.
    maxAge: '30d',
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

  const port = process.env.PORT || 5000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 BitCommerce Backend API running on http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger API Documentation available on http://localhost:${port}/swagger`);
}
bootstrap();
