import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Evento } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app.helper';
import { GaleriaAlbumWithRelations } from '../src/modules/gallery/repositories/gallery.repository.interface';

type EventResponseBody = Record<string, unknown>;

/**
 * Fonte: E:\agendas_eventos\src\components\EventCard.stories.jsx (export `baseEvent`),
 * conferido em 2026-08-08. Cópia hardcoded — projetos em repositórios separados, sem
 * import cross-repo possível. Se o EventCard passar a ler um campo novo do evento,
 * esta lista precisa ser atualizada manualmente para o teste continuar protegendo
 * a compatibilidade real.
 */
const FRONTEND_BASEEVENT_KEYS = [
  'id',
  'slug',
  'nome',
  'descricao',
  'data_evento',
  'horario',
  'dia_semana',
  'periodo',
  'modalidade',
  'link',
  'imagem',
  'cidade',
  'estado',
];

/** Contrato completo do DTO público — trava regressão de campos adicionados/removidos. */
const API_CONTRACT_KEYS = [
  'id',
  'slug',
  'nome',
  'descricao',
  'data_evento',
  'horario',
  'dia_semana',
  'periodo',
  'modalidade',
  'endereco',
  'cidade',
  'estado',
  'link',
  'imagem',
  'created_at',
  'updated_at',
];

const FORBIDDEN_KEYS = ['status', 'created_by', 'motivo_recusa'];

/**
 * Contrato do DTO enxuto de GET /events/featured — só os campos que
 * E:\agendas_eventos\src\components\EventCard.jsx lê quando a home renderiza
 * o card (variant="compact", showInfoRows=false, showDateBadge,
 * actionInternal — ver UpcomingEvents.jsx). Deliberadamente NÃO inclui
 * dia_semana/periodo/modalidade/link/cidade/estado/endereco/updated_at:
 * se um desses aparecer aqui, é regressão do contrato mínimo, não um campo
 * "esquecido".
 */
const FEATURED_CONTRACT_KEYS = [
  'id',
  'slug',
  'nome',
  'descricao',
  'data_evento',
  'horario',
  'imagem',
  'created_at',
];

function buildEvento(): Evento {
  return {
    id: '11111111-1111-1111-1111-111111111111',
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
  };
}

describe('Contrato de resposta — GET /events/published', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.evento.findMany.mockResolvedValue([buildEvento()]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bate exatamente com o contrato documentado da API (16 campos)', async () => {
    const response = await request(server).get('/events/published');
    const [firstEvent] = response.body as EventResponseBody[];

    expect(Object.keys(firstEvent).sort()).toEqual(
      [...API_CONTRACT_KEYS].sort(),
    );
  });

  it('contém todo campo que o EventCard do frontend lê (baseEvent)', async () => {
    const response = await request(server).get('/events/published');
    const [firstEvent] = response.body as EventResponseBody[];

    FRONTEND_BASEEVENT_KEYS.forEach((key) => {
      expect(firstEvent).toHaveProperty(key);
    });
  });

  it('nunca vaza campos internos de moderação', async () => {
    const response = await request(server).get('/events/published');
    const [firstEvent] = response.body as EventResponseBody[];

    FORBIDDEN_KEYS.forEach((key) => {
      expect(firstEvent).not.toHaveProperty(key);
    });
  });
});

describe('Contrato de resposta — GET /events/featured', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.evento.findMany.mockResolvedValue([
      {
        id: '11111111-1111-1111-1111-111111111111',
        nome: 'Meetup Café Bugado',
        slug: 'meetup-cafe-bugado',
        descricao: 'Um encontro mensal da comunidade',
        data_evento: '10/03/2026',
        horario: '19:00',
        imagem: null,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      } as never,
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bate exatamente com o contrato mínimo documentado (8 campos)', async () => {
    const response = await request(server).get('/events/featured');
    const [firstEvent] = response.body as EventResponseBody[];

    expect(Object.keys(firstEvent).sort()).toEqual(
      [...FEATURED_CONTRACT_KEYS].sort(),
    );
  });

  it('nunca vaza campos internos de moderação', async () => {
    const response = await request(server).get('/events/featured');
    const [firstEvent] = response.body as EventResponseBody[];

    FORBIDDEN_KEYS.forEach((key) => {
      expect(firstEvent).not.toHaveProperty(key);
    });
  });

  it('não inclui os campos "completos" que o endpoint /published tem e este não deve ter', async () => {
    const response = await request(server).get('/events/featured');
    const [firstEvent] = response.body as EventResponseBody[];

    [
      'dia_semana',
      'periodo',
      'modalidade',
      'endereco',
      'cidade',
      'estado',
      'link',
      'updated_at',
    ].forEach((key) => {
      expect(firstEvent).not.toHaveProperty(key);
    });
  });
});

const TAG_CONTRACT_KEYS = ['id', 'nome', 'cor'];
const TAG_FORBIDDEN_KEYS = ['created_at', 'updated_at', 'created_by'];

function buildTagRow() {
  return {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Backend',
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
  };
}

describe('Contrato de resposta — GET /tags e GET /events/tags-map', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.tag.findMany.mockResolvedValue([buildTagRow()] as never);
    prisma.eventoTag.findMany.mockResolvedValue([
      { evento_id: '11111111-1111-1111-1111-111111111111', tag: buildTagRow() },
    ] as never);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tags bate exatamente com o contrato documentado (id/nome/cor)', async () => {
    const response = await request(server).get('/tags');
    const [firstTag] = response.body as EventResponseBody[];

    expect(Object.keys(firstTag).sort()).toEqual([...TAG_CONTRACT_KEYS].sort());
  });

  it('GET /tags nunca vaza campos internos (created_at/updated_at/created_by)', async () => {
    const response = await request(server).get('/tags');
    const [firstTag] = response.body as EventResponseBody[];

    TAG_FORBIDDEN_KEYS.forEach((key) => {
      expect(firstTag).not.toHaveProperty(key);
    });
  });

  it('GET /events/tags-map bate exatamente com o mesmo contrato de tag por evento', async () => {
    const response = await request(server).get('/events/tags-map');
    const body = response.body as Record<string, EventResponseBody[]>;
    const [firstTag] = body['11111111-1111-1111-1111-111111111111'];

    expect(Object.keys(firstTag).sort()).toEqual([...TAG_CONTRACT_KEYS].sort());
  });
});

describe('Contrato de resposta — GET /events/slug/{slugOrId}/detail', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.evento.findFirst.mockResolvedValue(buildEvento());
    prisma.tag.findMany.mockResolvedValue([buildTagRow()] as never);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bate exatamente com o envelope { evento, tags }', async () => {
    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );
    const body = response.body as {
      evento: EventResponseBody;
      tags: EventResponseBody[];
    };

    expect(Object.keys(body).sort()).toEqual(['evento', 'tags']);
    expect(Object.keys(body.evento).sort()).toEqual(
      [...API_CONTRACT_KEYS].sort(),
    );
    expect(Object.keys(body.tags[0]).sort()).toEqual(
      [...TAG_CONTRACT_KEYS].sort(),
    );
  });

  it('nunca vaza campos internos de moderação dentro de evento', async () => {
    const response = await request(server).get(
      '/events/slug/meetup-cafe-bugado/detail',
    );
    const body = response.body as { evento: EventResponseBody };

    FORBIDDEN_KEYS.forEach((key) => {
      expect(body.evento).not.toHaveProperty(key);
    });
  });
});

const CONTRIBUTOR_CONTRACT_KEYS = [
  'id',
  'nome',
  'avatar_url',
  'github_url',
  'linkedin_url',
  'portfolio_url',
];
const CONTRIBUTOR_FORBIDDEN_KEYS = [
  'github_username',
  'created_at',
  'updated_at',
];

function buildContribuinteRow() {
  return {
    id: '66666666-6666-6666-6666-666666666666',
    github_username: 'alice',
    nome: 'Alice',
    avatar_url: 'https://example.com/a.png',
    github_url: 'https://github.com/alice',
    linkedin_url: 'https://linkedin.com/in/alice',
    portfolio_url: 'https://alice.dev',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('Contrato de resposta — GET /contributors', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.contribuinte.findMany.mockResolvedValue([
      buildContribuinteRow(),
    ] as never);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bate exatamente com o contrato documentado (6 campos)', async () => {
    const response = await request(server).get('/contributors');
    const [first] = response.body as EventResponseBody[];

    expect(Object.keys(first).sort()).toEqual(
      [...CONTRIBUTOR_CONTRACT_KEYS].sort(),
    );
  });

  it('nunca vaza github_username/created_at/updated_at', async () => {
    const response = await request(server).get('/contributors');
    const [first] = response.body as EventResponseBody[];

    CONTRIBUTOR_FORBIDDEN_KEYS.forEach((key) => {
      expect(first).not.toHaveProperty(key);
    });
  });
});

const GALLERY_ALBUM_CONTRACT_KEYS = [
  'id',
  'evento_nome',
  'evento_data',
  'comunidade_nome',
  'created_by_nome',
  'created_at',
  'fotos',
];
const GALLERY_FOTO_CONTRACT_KEYS = [
  'id',
  'url',
  'legenda',
  'ordem',
  'uploaded_by_nome',
  'created_at',
];
const GALLERY_ALBUM_FORBIDDEN_KEYS = [
  'evento_id',
  'comunidade_id',
  'created_by',
];
const GALLERY_FOTO_FORBIDDEN_KEYS = ['album_id', 'uploaded_by', 'storage_path'];

function buildGaleriaAlbumRow(): GaleriaAlbumWithRelations {
  return {
    id: '77777777-7777-7777-7777-777777777777',
    created_at: new Date('2026-02-10T00:00:00.000Z'),
    created_by: '88888888-8888-8888-8888-888888888888',
    evento: { nome: 'Meetup Café Bugado', data_evento: '10/02/2026' },
    comunidade: { nome: 'Café Bugado' },
    fotos: [
      {
        id: '99999999-9999-9999-9999-999999999999',
        url: 'https://example.com/foto1.png',
        legenda: 'Galera do meetup',
        ordem: 0,
        uploaded_by: '88888888-8888-8888-8888-888888888888',
        created_at: new Date('2026-02-10T01:00:00.000Z'),
      },
    ],
  };
}

describe('Contrato de resposta — GET /gallery/albums/public', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: DeepMockProxy<PrismaService>;

  beforeAll(async () => {
    ({ app, server, prisma } = await createTestApp());

    prisma.galeriaAlbum.findMany.mockResolvedValue([
      buildGaleriaAlbumRow(),
    ] as never);
    prisma.userProfile.findMany.mockResolvedValue([
      {
        user_id: '88888888-8888-8888-8888-888888888888',
        nome: 'Alice',
        sobrenome: 'Souza',
      },
    ] as never);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bate exatamente com o contrato documentado (álbum e fotos)', async () => {
    const response = await request(server).get('/gallery/albums/public');
    const [first] = response.body as EventResponseBody[];

    expect(Object.keys(first).sort()).toEqual(
      [...GALLERY_ALBUM_CONTRACT_KEYS].sort(),
    );
    const fotos = first.fotos as EventResponseBody[];
    expect(Object.keys(fotos[0]).sort()).toEqual(
      [...GALLERY_FOTO_CONTRACT_KEYS].sort(),
    );
  });

  it('nunca vaza evento_id/comunidade_id/created_by no álbum nem album_id/uploaded_by/storage_path na foto', async () => {
    const response = await request(server).get('/gallery/albums/public');
    const [first] = response.body as EventResponseBody[];
    const fotos = first.fotos as EventResponseBody[];

    GALLERY_ALBUM_FORBIDDEN_KEYS.forEach((key) => {
      expect(first).not.toHaveProperty(key);
    });
    GALLERY_FOTO_FORBIDDEN_KEYS.forEach((key) => {
      expect(fotos[0]).not.toHaveProperty(key);
    });
  });
});
