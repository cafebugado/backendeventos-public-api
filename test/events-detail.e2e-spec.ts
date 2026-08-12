import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Evento } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

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

describe('GET /events/slug/:slugOrId (e2e)', () => {
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

describe('GET /events/slug/:slugOrId/detail (e2e)', () => {
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
    prisma.evento.findFirst.mockReset();
    prisma.tag.findMany.mockReset();
  });

  it('documenta GET /events/slug/{slugOrId}/detail no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/events/slug/{slugOrId}/detail');
  });

  it('retorna 200 com { evento, tags } quando o evento existe e tem tags', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([buildTag()] as never);

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );
    const body = response.body as {
      evento?: EventResponseBody;
      tags?: EventResponseBody[];
    };

    expect(response.status).toBe(200);
    expect(body.evento?.slug).toBe('meetup-cafe-bugado');
    expect(body.tags).toHaveLength(1);
    expect(body.tags?.[0]).toMatchObject({ nome: 'Backend' });
  });

  it('retorna tags: [] quando o evento existe mas não tem nenhuma tag', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([]);

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );
    const body = response.body as { tags?: EventResponseBody[] };

    expect(response.status).toBe(200);
    expect(body.tags).toEqual([]);
  });

  it('retorna 404 quando o evento não existe/não está publicado', async () => {
    prisma.evento.findFirst.mockResolvedValue(null);

    await request(server).get('/events/slug/inexistente/detail').expect(404);
  });

  it('retorna o header Cache-Control configurado (herdado do controller)', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([]);

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });

  it('nunca inclui status, created_by ou motivo_recusa dentro de evento', async () => {
    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([]);

    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );
    const body = response.body as { evento?: EventResponseBody };

    expect(body.evento).not.toHaveProperty('status');
    expect(body.evento).not.toHaveProperty('created_by');
    expect(body.evento).not.toHaveProperty('motivo_recusa');
  });
});
