import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { SAFE_LIST_LIMIT } from '../src/common/constants/pagination';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

type ResponseBody = Record<string, unknown>;

function buildContribuinte(
  overrides: Partial<{
    id: string;
    github_username: string;
    nome: string;
    avatar_url: string;
    github_url: string;
    linkedin_url: string | null;
    portfolio_url: string | null;
  }> = {},
) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    github_username: 'alice',
    nome: 'Alice',
    avatar_url: 'https://example.com/a.png',
    github_url: 'https://github.com/alice',
    linkedin_url: 'https://linkedin.com/in/alice',
    portfolio_url: 'https://alice.dev',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GET /contributors (e2e)', () => {
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
    prisma.contribuinte.findMany.mockReset();
  });

  it('documenta a rota no Swagger (/docs-json)', async () => {
    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/contributors');
  });

  it('retorna 200, application/json e um array', async () => {
    prisma.contribuinte.findMany.mockResolvedValue([
      buildContribuinte(),
    ] as never);

    const response = await request(server).get('/contributors');
    const body = response.body as ResponseBody[];

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(body)).toBe(true);
  });

  it('retorna array vazio quando não há contribuintes cadastrados', async () => {
    prisma.contribuinte.findMany.mockResolvedValue([]);

    const response = await request(server).get('/contributors');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('retorna exatamente id/nome/avatar_url/github_url/linkedin_url/portfolio_url, sem campos internos', async () => {
    prisma.contribuinte.findMany.mockResolvedValue([
      buildContribuinte(),
    ] as never);

    const response = await request(server).get('/contributors');
    const [first] = response.body as ResponseBody[];

    expect(Object.keys(first).sort()).toEqual(
      [
        'avatar_url',
        'github_url',
        'id',
        'linkedin_url',
        'nome',
        'portfolio_url',
      ].sort(),
    );
    expect(first).not.toHaveProperty('github_username');
    expect(first).not.toHaveProperty('created_at');
    expect(first).not.toHaveProperty('updated_at');
  });

  it('busca ordenado por nome', async () => {
    prisma.contribuinte.findMany.mockResolvedValue([]);

    await request(server).get('/contributors');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.contribuinte.findMany).toHaveBeenCalledWith({
      orderBy: { nome: 'asc' },
      take: SAFE_LIST_LIMIT,
    });
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.contribuinte.findMany.mockResolvedValue([]);

    const response = await request(server).get('/contributors');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });
});
