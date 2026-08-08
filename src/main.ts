import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import type { RootConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const configService = app.get(ConfigService<RootConfig>);
  const port = configService.get('app.port', { infer: true }) ?? 3000;

  await app.listen(port);
}

void bootstrap();
