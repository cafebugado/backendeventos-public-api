import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import type { Application } from 'express';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createSwaggerBasicAuthMiddleware } from './common/middleware/swagger-basic-auth.middleware';
import type { RootConfig } from './config/configuration';

// Precisa bater com a versão de swagger-ui-dist que o @nestjs/swagger instalado
// usa internamente (node_modules/@nestjs/swagger/package.json). Servida via CDN
// em vez de estática local porque a Vercel (serverless) não serve os assets
// estáticos do Swagger UI corretamente — /docs carregava, mas
// swagger-ui-bundle.js/swagger-ui.css davam 404 e a página ficava em branco.
const SWAGGER_UI_VERSION = '5.32.8';
const SWAGGER_UI_CDN_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

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

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Libera só o jsdelivr (CDN do swagger-ui-dist) — ver comentário do
          // SWAGGER_UI_CDN_BASE acima. Resto do CSP continua no default do
          // Helmet (bem restrito).
          'script-src': ["'self'", SWAGGER_UI_CDN_BASE],
          'img-src': ["'self'", 'data:', SWAGGER_UI_CDN_BASE],
        },
      },
    }),
  );
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

  // Swagger fica disponível em qualquer ambiente (incluindo produção) — o
  // time precisa acessar /docs em produção pra conferir a API real. Se
  // SWAGGER_USER e SWAGGER_PASSWORD estiverem configuradas, a rota exige
  // HTTP Basic Auth; se não estiverem, fica aberta (mesmo comportamento de
  // antes em dev/test). A checagem de auth precisa ser registrada ANTES do
  // SwaggerModule.setup(), já que o Express processa middlewares na ordem
  // em que foram registrados para um mesmo path.
  const swaggerUser = configService.get('app.swaggerUser', { infer: true });
  const swaggerPassword = configService.get('app.swaggerPassword', {
    infer: true,
  });
  if (swaggerUser && swaggerPassword) {
    app.use(
      ['/docs', '/docs-json'],
      createSwaggerBasicAuthMiddleware(swaggerUser, swaggerPassword),
    );
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eventos Café Bugado — Public API')
    .setDescription(
      'API pública read-only de eventos, consumida pelo frontend agendas_eventos. ' +
        'Independente do backendeventos (FastAPI); lê do mesmo Postgres com uma role somente-leitura.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customCssUrl: `${SWAGGER_UI_CDN_BASE}/swagger-ui.css`,
    customJs: [
      `${SWAGGER_UI_CDN_BASE}/swagger-ui-bundle.js`,
      `${SWAGGER_UI_CDN_BASE}/swagger-ui-standalone-preset.js`,
    ],
    customfavIcon: `${SWAGGER_UI_CDN_BASE}/favicon-32x32.png`,
  });
}
