import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('api.port', 4000);
  const host = config.get<string>('api.host', '0.0.0.0');
  const prefix = config.get<string>('api.prefix', 'api/v1');
  const corsOrigin = config.get<string>('api.corsOrigin', 'http://localhost:3000');

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Explicit @Type / @ToBoolean / @Transform on every DTO field.
      // Implicit conversion uses Boolean() for bool fields, which silently
      // turns "false" into true — broke the client-list blacklisted filter.
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableShutdownHooks();

  await app.listen(port, host);
  logger.log(`AutoSphere API running at http://${host}:${port}/${prefix}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap API', err);
  process.exit(1);
});
