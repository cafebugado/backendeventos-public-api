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

const VALID_UUID = '11111111-1111-1111-1111-111111111111';

function buildEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: VALID_UUID,
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

describe('GET /events/slug/:slugOrId (e2e)', () => {
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
    prisma.evento.findFirst.mockReset();
  });

  it('documenta GET /events/slug/{slugOrId} no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/events/slug/{slugOrId}');
  });

  it('retorna 200 com o evento completo quando encontrado por slug', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado',
    );
    const body = response.body as EventResponseBody;

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(body.slug).toBe('meetup-cafe-bugado');
  });

  it('retorna 200 com o evento completo quando encontrado por id (UUID)', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());

    const response = await request(server).get(`/events/slug/${VALID_UUID}`);
    const body = response.body as EventResponseBody;

    expect(response.status).toBe(200);
    expect(body.id).toBe(VALID_UUID);
  });

  it('retorna o header Cache-Control configurado (herdado do controller)', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado',
    );

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });

  it('retorna 404 quando não existe evento com o slug/id informado', async () => {
    prisma.evento.findFirst.mockResolvedValue(null);

    await request(server).get('/events/slug/nao-existe').expect(404);
  });

  it('retorna 404 (não 500) para uma string arbitrária no lugar de um UUID', async () => {
    prisma.evento.findFirst.mockResolvedValue(null);

    await request(server).get('/events/slug/isso-nao-e-um-uuid').expect(404);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.evento.findFirst).toHaveBeenCalledWith({
      where: {
        status: 'publicado',
        OR: [{ slug: 'isso-nao-e-um-uuid' }],
      },
    });
  });

  it('nunca inclui status, created_by ou motivo_recusa no payload', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado',
    );
    const body = response.body as EventResponseBody;

    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('created_by');
    expect(body).not.toHaveProperty('motivo_recusa');
  });
});
