import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventoFeaturedFields } from '../src/modules/events/repositories/evento.repository.interface';
import { createTestApp } from './test-app.helper';

type EventResponseBody = Record<string, unknown>;

function buildEventoFeatured(
  overrides: Partial<EventoFeaturedFields> = {},
): EventoFeaturedFields {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Meetup Café Bugado',
    slug: 'meetup-cafe-bugado',
    descricao: 'Um encontro mensal da comunidade',
    data_evento: '10/03/2026',
    horario: '19:00',
    imagem: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GET /events/featured (e2e)', () => {
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
    prisma.evento.findMany.mockReset();
  });

  it('documenta GET /events/featured no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/events/featured');
  });

  it('retorna 200, application/json e um array', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEventoFeatured()] as never);

    const response = await request(server).get('/events/featured');
    const body = response.body as EventResponseBody[];

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(body)).toBe(true);
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEventoFeatured()] as never);

    const response = await request(server).get('/events/featured');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });

  it('usa 3 como limit default quando nenhum é informado', async () => {
    prisma.evento.findMany.mockResolvedValue([]);

    const response = await request(server).get('/events/featured');

    expect(response.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.evento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
  });

  it('repassa ?limit=2 para a query do repositório', async () => {
    prisma.evento.findMany.mockResolvedValue([
      buildEventoFeatured(),
      buildEventoFeatured({ id: '33333333-3333-3333-3333-333333333333' }),
    ] as never);

    const response = await request(server).get('/events/featured?limit=2');
    const body = response.body as EventResponseBody[];

    expect(response.status).toBe(200);
    expect(body.length).toBeLessThanOrEqual(2);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.evento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2 }),
    );
  });

  it('rejeita limit fora do intervalo 1-10 com 400', async () => {
    await request(server).get('/events/featured?limit=0').expect(400);
    await request(server).get('/events/featured?limit=11').expect(400);
  });

  it('retorna exatamente os 8 campos do contrato mínimo, nada mais', async () => {
    prisma.evento.findMany.mockResolvedValue([buildEventoFeatured()] as never);

    const response = await request(server).get('/events/featured');
    const [firstEvent] = response.body as EventResponseBody[];

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

  it('bloqueia CORS para uma origem não listada em CORS_ORIGINS', async () => {
    prisma.evento.findMany.mockResolvedValue([]);

    const response = await request(server)
      .get('/events/featured')
      .set('Origin', 'http://evil.example.com');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('libera CORS para uma origem configurada em CORS_ORIGINS', async () => {
    prisma.evento.findMany.mockResolvedValue([]);

    const response = await request(server)
      .get('/events/featured')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });
});
