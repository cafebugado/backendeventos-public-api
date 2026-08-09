import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Evento } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

type ResponseBody = Record<string, unknown>;

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
    created_by: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function buildTag() {
  return {
    id: '55555555-5555-5555-5555-555555555555',
    nome: 'Backend',
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
  };
}

describe('GET /events/:eventoId/tags (e2e)', () => {
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
    prisma.tag.findMany.mockReset();
  });

  it('documenta a rota no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(document.paths).toHaveProperty('/events/{eventoId}/tags');
  });

  it('retorna 200 e array de tags quando o evento tem tags', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([buildTag()] as never);

    const response = await request(server).get(`/events/${VALID_UUID}/tags`);
    const body = response.body as ResponseBody[];

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ nome: 'Backend' });
  });

  it('retorna array vazio quando o evento existe mas não tem tags', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([]);

    const response = await request(server).get(`/events/${VALID_UUID}/tags`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('retorna 404 quando o evento não existe/não está publicado', async () => {
    prisma.evento.findFirst.mockResolvedValue(null);

    await request(server).get(`/events/${VALID_UUID}/tags`).expect(404);
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([]);

    const response = await request(server).get(`/events/${VALID_UUID}/tags`);

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });
});
