import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

/**
 * Protege o comportamento de dois middlewares globais que não tinham teste:
 * `compression` (app.setup.ts) e `ThrottlerGuard` (app.module.ts: 60 req/min
 * por IP). Atualizações desses pacotes (Dependabot) passam a ser validadas
 * pelo comportamento, não só pela compilação.
 */

const LIMIT = 60; // precisa bater com ThrottlerModule.forRoot em app.module.ts

/** Tags suficientes para o corpo passar do threshold padrão do compression (1 KB). */
function buildTags(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    nome: `Tag de exemplo número ${i}`,
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
  }));
}

describe('Compressão das respostas (e2e)', () => {
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
    prisma.tag.findMany.mockResolvedValue(buildTags(40));
  });

  it('comprime com gzip quando o cliente aceita', async () => {
    const res = await request(server)
      .get('/tags')
      .set('X-Forwarded-For', '203.0.113.10')
      .set('Accept-Encoding', 'gzip');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
    // O supertest descomprime: o conteúdo continua íntegro.
    expect(res.body).toHaveLength(40);
  });

  it('não comprime quando o cliente não aceita compressão', async () => {
    const res = await request(server)
      .get('/tags')
      .set('X-Forwarded-For', '203.0.113.11')
      .set('Accept-Encoding', 'identity');

    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.body).toHaveLength(40);
  });
});

describe('Limite de requisições por cliente (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  // Cada describe sobe sua própria app, então o contador do throttler começa zerado.
  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());
    prisma.tag.findMany.mockResolvedValue([]);
  });

  afterAll(async () => {
    await app.close();
  });

  const hit = (ip: string) =>
    request(server).get('/tags').set('X-Forwarded-For', ip);

  it(`aceita ${LIMIT} requisições por minuto e responde 429 na seguinte`, async () => {
    const ip = '198.51.100.1';

    for (let i = 1; i <= LIMIT; i++) {
      const res = await hit(ip);
      expect(res.status).toBe(200);
    }

    const blocked = await hit(ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ statusCode: 429, path: '/tags' });
    // O cliente precisa saber quando pode tentar de novo.
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('conta por cliente (X-Forwarded-For via trust proxy), não para a API inteira', async () => {
    // O IP do teste anterior já está bloqueado; um cliente diferente não pode ser afetado.
    expect((await hit('198.51.100.1')).status).toBe(429);
    expect((await hit('198.51.100.2')).status).toBe(200);
  });
});
