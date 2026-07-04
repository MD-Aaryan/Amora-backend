import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // Enable CORS for all frontend portals
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://lohanaa.com',
    ],
    credentials: true,
  });

  // Global validation pipe: auto-validates DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter: uniform error response shape
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors: response wrapping + request logging
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`AMORA backend is running on http://localhost:${port}/api/v1`);
}
bootstrap();
