import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Evento } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

type EventResponseBody = Record<string, unknown>;

function buildEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Meetup Café Bugado',
    slug: 'meetup-cafe-bugado',
    descricao: 'Um encontro mensal da comunidade',
    data_evento: '10/03/2026',
    horario: '19:00',
    dia_semana: 'Terça-feira',
    periodo: 'Noturno',
    link: 'https://cafebugado.com.br',
    imagem: null,
    modalidade: 'Online',
    endereco: null,
    cidade: 'São Paulo',
    estado: 'SP',
    status: 'publicado',
    motivo_recusa: null,
    created_by: '22222222-2222-2222-2222-222222222222',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GET /events/published (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    prisma = mockDeep<PrismaService>();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.evento.findMany.mockReset();
  });

  it('documenta GET /events/published no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/events/published');
  });

  it('retorna 200, application/json e um array', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEvento()]);

    const response = await request(server).get('/events/published');
    const body = response.body as EventResponseBody[];

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(body)).toBe(true);
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEvento()]);

    const response = await request(server).get('/events/published');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });

  it('repassa ?limit=2 para a query do repositório (no máximo 2 itens)', async () => {
    prisma.evento.findMany.mockResolvedValue([
      buildEvento(),
      buildEvento({ id: '33333333-3333-3333-3333-333333333333' }),
    ]);

    const response = await request(server).get('/events/published?limit=2');
    const body = response.body as EventResponseBody[];

    expect(response.status).toBe(200);
    expect(body.length).toBeLessThanOrEqual(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.evento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2, skip: 0 }),
    );
  });

  it('rejeita limit fora do intervalo 1-100 com 400', async () => {
    await request(server).get('/events/published?limit=0').expect(400);
    await request(server).get('/events/published?limit=101').expect(400);
  });

  it('nunca inclui status, created_by ou motivo_recusa no payload', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEvento()]);

    const response = await request(server).get('/events/published');
    const [firstEvent] = response.body as EventResponseBody[];

    expect(firstEvent).not.toHaveProperty('status');
    expect(firstEvent).not.toHaveProperty('created_by');
    expect(firstEvent).not.toHaveProperty('motivo_recusa');
  });

  it('bloqueia CORS para uma origem não listada em CORS_ORIGINS', async () => {
    prisma.evento.findMany.mockResolvedValue([]);

    const response = await request(server)
      .get('/events/published')
      .set('Origin', 'http://evil.example.com');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('libera CORS para uma origem configurada em CORS_ORIGINS', async () => {
    prisma.evento.findMany.mockResolvedValue([]);

    const response = await request(server)
      .get('/events/published')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });
});
