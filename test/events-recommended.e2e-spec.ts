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

/** "DD/MM/YYYY" relativo a hoje — mantém o teste válido independente da data de execução. */
function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

function buildEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: VALID_UUID,
    nome: 'Meetup Café Bugado',
    slug: 'meetup-cafe-bugado',
    descricao: 'Um encontro mensal da comunidade',
    data_evento: daysFromNow(1),
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

describe('GET /events/:id/recommended (e2e)', () => {
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
    prisma.evento.findMany.mockReset();
    prisma.eventoTag.findMany.mockReset();
    prisma.eventoTag.findMany.mockResolvedValue([]);
  });

  it('documenta a rota no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(document.paths).toHaveProperty('/events/{id}/recommended');
  });

  it('retorna 404 quando o evento não existe/não está publicado', async () => {
    prisma.evento.findFirst.mockResolvedValue(null);

    await request(server).get(`/events/${VALID_UUID}/recommended`).expect(404);
  });

  it('retorna até 3 eventos por padrão, nunca o próprio evento', async () => {
    const current = buildEvento();
    const others = [2, 3, 4, 5].map((n) =>
      buildEvento({
        id: `22222222-2222-2222-2222-22222222222${n}`,
        slug: `evento-${n}`,
        data_evento: daysFromNow(n),
      }),
    );
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current, ...others]);

    const response = await request(server).get(
      `/events/${VALID_UUID}/recommended`,
    );
    const body = response.body as ResponseBody[];

    expect(response.status).toBe(200);
    expect(body).toHaveLength(3);
    expect(body.some((e) => e.id === VALID_UUID)).toBe(false);
  });

  it('respeita ?limit= informado', async () => {
    const current = buildEvento();
    const others = [2, 3, 4, 5].map((n) =>
      buildEvento({
        id: `22222222-2222-2222-2222-22222222222${n}`,
        slug: `evento-${n}`,
        data_evento: daysFromNow(n),
      }),
    );
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current, ...others]);

    const response = await request(server).get(
      `/events/${VALID_UUID}/recommended?limit=2`,
    );
    const body = response.body as ResponseBody[];

    expect(response.status).toBe(200);
    expect(body).toHaveLength(2);
  });

  it('retorna array vazio (nunca erro) quando não há candidatos', async () => {
    const current = buildEvento();
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current]);

    const response = await request(server).get(
      `/events/${VALID_UUID}/recommended`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('rejeita ?limit= não numérico com 400', async () => {
    const current = buildEvento();
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current]);

    await request(server)
      .get(`/events/${VALID_UUID}/recommended?limit=abc`)
      .expect(400);
  });

  it('retorna exatamente os 8 campos do contrato mínimo (mesmo shape de /events/featured)', async () => {
    const current = buildEvento();
    const other = buildEvento({
      id: '33333333-3333-3333-3333-333333333333',
      slug: 'outro-evento',
      data_evento: daysFromNow(2),
    });
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current, other]);

    const response = await request(server).get(
      `/events/${VALID_UUID}/recommended`,
    );
    const [firstEvent] = response.body as ResponseBody[];

    expect(Object.keys(firstEvent).sort()).toEqual(
      [
        'id',
        'slug',
        'nome',
        'descricao',
        'data_evento',
        'horario',
        'imagem',
        'created_at',
      ].sort(),
    );
  });

  it('retorna o header Cache-Control configurado', async () => {
    const current = buildEvento();
    prisma.evento.findFirst.mockResolvedValue(current);
    prisma.evento.findMany.mockResolvedValue([current]);

    const response = await request(server).get(
      `/events/${VALID_UUID}/recommended`,
    );

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });
});
