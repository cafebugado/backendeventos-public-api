import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import type { Application } from 'express';
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

  // Sem isso, req.ip é sempre o IP do load balancer da hospedagem (não o do
  // cliente real), e o ThrottlerGuard (ver AppModule) passa a limitar a API
  // inteira em vez de por cliente — 1 confia só no hop imediato à frente
  // (o proxy da hospedagem), evitando que X-Forwarded-For seja spoofável
  // por um cliente mal-intencionado mais além na cadeia.
  (app.getHttpAdapter().getInstance() as Application).set('trust proxy', 1);

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

  // Swagger documenta schema/endpoints em detalhe — não vaza segredo (API já
  // é 100% pública), mas facilita reconhecimento de superfície de ataque.
  // Fica disponível em dev/test, desabilitado em produção.
  if (process.env.NODE_ENV !== 'production') {
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
}
