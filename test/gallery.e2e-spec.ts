import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';
import { GaleriaAlbumWithRelations } from '../src/modules/gallery/repositories/gallery.repository.interface';

type ResponseBody = Record<string, unknown>;

function buildAlbumRow(
  overrides: Partial<GaleriaAlbumWithRelations> = {},
): GaleriaAlbumWithRelations {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date('2026-02-10T00:00:00.000Z'),
    created_by: '22222222-2222-2222-2222-222222222222',
    evento: { nome: 'Meetup Café Bugado', data_evento: '10/02/2026' },
    comunidade: { nome: 'Café Bugado' },
    fotos: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        url: 'https://example.com/foto1.png',
        legenda: 'Galera do meetup',
        ordem: 0,
        uploaded_by: '22222222-2222-2222-2222-222222222222',
        created_at: new Date('2026-02-10T01:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

function buildProfileRow() {
  return {
    user_id: '22222222-2222-2222-2222-222222222222',
    nome: 'Alice',
    sobrenome: 'Souza',
  };
}

describe('GET /gallery/albums/public (e2e)', () => {
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
    prisma.galeriaAlbum.findMany.mockReset();
    prisma.userProfile.findMany.mockReset();
  });

  it('documenta a rota no Swagger (/docs-json)', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([] as never);
    prisma.userProfile.findMany.mockResolvedValue([]);

    const response = await request(server).get('/docs-json');
    const document = response.body as { paths?: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(document.paths).toHaveProperty('/gallery/albums/public');
  });

  it('retorna 200, application/json e um array', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([buildAlbumRow()] as never);
    prisma.userProfile.findMany.mockResolvedValue([buildProfileRow()] as never);

    const response = await request(server).get('/gallery/albums/public');
    const body = response.body as ResponseBody[];

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(Array.isArray(body)).toBe(true);
  });

  it('retorna array vazio quando não há álbuns cadastrados', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([] as never);
    prisma.userProfile.findMany.mockResolvedValue([]);

    const response = await request(server).get('/gallery/albums/public');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('resolve evento_nome/evento_data/comunidade_nome/created_by_nome e as fotos aninhadas', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([buildAlbumRow()] as never);
    prisma.userProfile.findMany.mockResolvedValue([buildProfileRow()] as never);

    const response = await request(server).get('/gallery/albums/public');
    const [first] = response.body as ResponseBody[];

    expect(first).toMatchObject({
      evento_nome: 'Meetup Café Bugado',
      evento_data: '10/02/2026',
      comunidade_nome: 'Café Bugado',
      created_by_nome: 'Alice Souza',
    });
    const fotos = first.fotos as ResponseBody[];
    expect(fotos).toHaveLength(1);
    expect(fotos[0]).toMatchObject({
      url: 'https://example.com/foto1.png',
      legenda: 'Galera do meetup',
      uploaded_by_nome: 'Alice Souza',
    });
  });

  it('nenhum campo interno (evento_id, comunidade_id, created_by, uploaded_by, storage_path) vaza no payload', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([buildAlbumRow()] as never);
    prisma.userProfile.findMany.mockResolvedValue([buildProfileRow()] as never);

    const response = await request(server).get('/gallery/albums/public');
    const [first] = response.body as ResponseBody[];
    const [foto] = first.fotos as ResponseBody[];

    expect(first).not.toHaveProperty('evento_id');
    expect(first).not.toHaveProperty('comunidade_id');
    expect(first).not.toHaveProperty('created_by');
    expect(foto).not.toHaveProperty('uploaded_by');
    expect(foto).not.toHaveProperty('storage_path');
  });

  it('busca álbuns ordenados por created_at desc', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([] as never);
    prisma.userProfile.findMany.mockResolvedValue([]);

    await request(server).get('/gallery/albums/public');

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended
    expect(prisma.galeriaAlbum.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { created_at: 'desc' } }),
    );
  });

  it('retorna o header Cache-Control configurado', async () => {
    prisma.galeriaAlbum.findMany.mockResolvedValue([] as never);
    prisma.userProfile.findMany.mockResolvedValue([]);

    const response = await request(server).get('/gallery/albums/public');

    expect(response.headers['cache-control']).toBe(
      'public, max-age=30, stale-while-revalidate=120',
    );
  });
});
