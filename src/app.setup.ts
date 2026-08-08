import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import type { RootConfig } from './config/configuration';

/**
 * Configuração compartilhada entre main.ts (produção) e os testes e2e — extraída
 * para que o TestingModule aplique exatamente o mesmo Helmet/CORS/ValidationPipe/
 * Swagger da aplicação real, e não apenas o AppModule "nu".
 */
export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService<RootConfig>);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get('app.corsOrigins', { infer: true }),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eventos Café Bugado — Public API')
    .setDescription(
      'API pública read-only de eventos, consumida pelo frontend agendas_eventos. ' +
        'Independente do backendeventos (FastAPI); lê do mesmo Postgres com uma role somente-leitura.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
}
