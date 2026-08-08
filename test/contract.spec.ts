import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Evento } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

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
