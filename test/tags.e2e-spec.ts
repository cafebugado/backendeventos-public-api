import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { SAFE_LIST_LIMIT } from '../src/common/constants/pagination';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

type ResponseBody = Record<string, unknown>;

function buildTag(
  overrides: Partial<{ id: string; nome: string; cor: string | null }> = {},
) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Backend',
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
    ...overrides,
  };
}

describe('GET /tags e GET /events/tags-map (e2e)', () => {
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
    prisma.tag.findMany.mockReset();
    prisma.eventoTag.findMany.mockReset();
  });

  describe('GET /tags', () => {
    it('documenta a rota no Swagger (/docs-json)', async () => {
      const response = await request(server).get('/docs-json');
      const document = response.body as { paths?: Record<string, unknown> };

      expect(response.status).toBe(200);
      expect(document.paths).toHaveProperty('/tags');
    });

    it('retorna 200, application/json e um array', async () => {
      prisma.tag.findMany.mockResolvedValue([buildTag()] as never);

      const response = await request(server).get('/tags');
      const body = response.body as ResponseBody[];

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(Array.isArray(body)).toBe(true);
    });

    it('retorna o header Cache-Control configurado', async () => {
      prisma.tag.findMany.mockResolvedValue([]);

      const response = await request(server).get('/tags');

      expect(response.headers['cache-control']).toBe(
        'public, max-age=30, stale-while-revalidate=120',
      );
    });

    it('retorna exatamente id/nome/cor por tag, sem campos internos', async () => {
      prisma.tag.findMany.mockResolvedValue([buildTag()] as never);

      const response = await request(server).get('/tags');
      const [firstTag] = response.body as ResponseBody[];

      expect(Object.keys(firstTag).sort()).toEqual(['cor', 'id', 'nome']);
      expect(firstTag).not.toHaveProperty('created_by');
      expect(firstTag).not.toHaveProperty('created_at');
      expect(firstTag).not.toHaveProperty('updated_at');
    });

    it('busca ordenado por nome', async () => {
      prisma.tag.findMany.mockResolvedValue([]);

      await request(server).get('/tags');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
        take: SAFE_LIST_LIMIT,
      });
    });
  });

  describe('GET /events/tags-map', () => {
    it('documenta a rota no Swagger (/docs-json)', async () => {
      const response = await request(server).get('/docs-json');
      const document = response.body as { paths?: Record<string, unknown> };

      expect(document.paths).toHaveProperty('/events/tags-map');
    });

    it('retorna 200 e um objeto { eventoId: Tag[] }', async () => {
      prisma.eventoTag.findMany.mockResolvedValue([
        { evento_id: 'evento-1', tag: buildTag() },
      ] as never);

      const response = await request(server).get('/events/tags-map');
      const body = response.body as Record<string, ResponseBody[]>;

      expect(response.status).toBe(200);
      expect(body['evento-1']).toHaveLength(1);
      expect(body['evento-1'][0]).toMatchObject({ nome: 'Backend' });
    });

    it('retorna objeto vazio quando não há nenhuma associação evento-tag', async () => {
      prisma.eventoTag.findMany.mockResolvedValue([]);

      const response = await request(server).get('/events/tags-map');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({});
    });

    it('só considera evento_tags de eventos publicados', async () => {
      prisma.eventoTag.findMany.mockResolvedValue([]);

      await request(server).get('/events/tags-map');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
      expect(prisma.eventoTag.findMany).toHaveBeenCalledWith({
        where: { evento: { status: 'publicado' } },
        select: { evento_id: true, tag: true },
      });
    });

    it('retorna o header Cache-Control configurado', async () => {
      prisma.eventoTag.findMany.mockResolvedValue([]);

      const response = await request(server).get('/events/tags-map');

      expect(response.headers['cache-control']).toBe(
        'public, max-age=30, stale-while-revalidate=120',
      );
    });
  });
});
