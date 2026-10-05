import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

type EventResponseBody = Record<string, unknown>;

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'meetup-cafe-bugado',
    nome: 'Meetup Café Bugado',
    descricao: 'Um encontro mensal da comunidade',
    data_evento: '10/12/2026',
    horario: '19:00',
    dia_semana: 'Quinta-feira',
    periodo: 'Noturno',
    modalidade: 'Online',
    endereco: null,
    cidade: 'São Paulo',
    estado: 'SP',
    link: 'https://cafebugado.com.br',
    imagem: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GET /events/upcoming (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.$queryRaw.mockReset();
  });

  it('documenta GET /events/upcoming no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/events/upcoming');
  });

  it('retorna 200, application/json e os eventos na ordem devolvida pelo banco', async () => {
    prisma.$queryRaw.mockResolvedValue([
      buildRow({ id: 'a', data_evento: '10/12/2026' }),
      buildRow({ id: 'b', data_evento: '11/12/2026' }),
    ]);

    const response = await request(server).get('/events/upcoming');
    const body = response.body as EventResponseBody[];

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(body.map((evento) => evento.id)).toEqual(['a', 'b']);
  });

  it('não é capturada pelas rotas com parâmetro (/events/:id/...)', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const response = await request(server).get('/events/upcoming');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const response = await request(server).get('/events/upcoming');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=60, stale-while-revalidate=300',
    );
  });

  it('repassa ?limit e ?offset como parâmetros da consulta', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await request(server).get('/events/upcoming?limit=20&offset=40');

    const values = prisma.$queryRaw.mock.calls[0].slice(1);
    expect(values.slice(-2)).toEqual([20, 40]);
  });

  it.each(['limit=0', 'limit=501', 'limit=abc', 'offset=-1'])(
    'responde 400 para ?%s',
    async (query) => {
      const response = await request(server).get(`/events/upcoming?${query}`);

      expect(response.status).toBe(400);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    },
  );

  it('responde 400 para query param desconhecido', async () => {
    const response = await request(server).get('/events/upcoming?cidade=SP');

    expect(response.status).toBe(400);
  });
});
