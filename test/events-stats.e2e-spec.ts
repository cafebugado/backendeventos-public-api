import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';

describe('GET /events/stats/public (e2e)', () => {
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
    prisma.evento.count.mockReset();
  });

  it('retorna 200 com o total de eventos publicados', async () => {
    prisma.evento.count.mockResolvedValue(42);

    const response = await request(server).get('/events/stats/public');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ totalEventos: 42 });
  });

  // A rota fica no controller de eventos (janela curta), mas declara a própria
  // janela: a contagem muda poucas vezes por dia.
  it('retorna o Cache-Control da própria rota, não o do controller', async () => {
    prisma.evento.count.mockResolvedValue(42);

    const response = await request(server).get('/events/stats/public');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=300, stale-while-revalidate=3600',
    );
  });
});
