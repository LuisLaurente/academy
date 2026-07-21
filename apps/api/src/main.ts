import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new ConsoleLogger({ colors: false, json: true, prefix: 'learning-os-api' });
  const app = await NestFactory.create(AppModule, { logger });
  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('API_PORT');
  const corsOrigin = config.getOrThrow<string>('CORS_ORIGIN');
  const environment = config.getOrThrow<string>('NODE_ENV');

  app.setGlobalPrefix('api/v1');
  app.enableCors({ credentials: true, origin: corsOrigin });
  app.enableShutdownHooks();

  if (environment === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Learning OS API')
      .setDescription('Walking Skeleton: documentación técnica disponible solo en desarrollo.')
      .setVersion('0.1.0')
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, documentFactory);
  }

  await app.listen(port, '0.0.0.0');
  logger.log({ event: 'application.started', port });
}

void bootstrap();
