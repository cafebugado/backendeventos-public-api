import { NotFoundException } from '@nestjs/common';
import { Evento, Tag } from '@prisma/client';
import {
  EventoFeaturedFields,
  IEventoRepository,
} from './repositories/evento.repository.interface';
import { ITagRepository } from '../tags/repositories/tag.repository.interface';
import { todayInSaoPaulo } from '../../common/utils/event-date.util';
import { EventsService } from './events.service';

function buildTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    nome: 'Backend',
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
    ...overrides,
  };
}

/** "DD/MM/YYYY" relativo a hoje (em Brasília) — mantém os testes válidos independente da data de execução. */
function daysFromNow(days: number): string {
  const date = todayInSaoPaulo();
  date.setUTCDate(date.getUTCDate() + days);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getUTCFullYear()}`;
}

function buildEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Meetup Café Bugado',
    slug: 'meetup-cafe-bugado',
    descricao: null,
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
    created_by: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function buildEventoFeatured(
  overrides: Partial<EventoFeaturedFields> = {},
): EventoFeaturedFields {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'meetup-cafe-bugado',
    nome: 'Meetup Café Bugado',
    descricao: null,
    data_evento: '10/03/2026',
    horario: '19:00',
    imagem: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('EventsService', () => {
  function createService(): {
    service: EventsService;
    repo: jest.Mocked<IEventoRepository>;
    tagRepo: jest.Mocked<ITagRepository>;
  } {
    const repo: jest.Mocked<IEventoRepository> = {
      findPublished: jest.fn(),
      findFeatured: jest.fn(),
      findUpcoming: jest.fn(),
      findFeaturedByIds: jest.fn(),
      findRecommendationCandidates: jest.fn(),
      findBySlugOrId: jest.fn(),
      countPublished: jest.fn(),
    };
    const tagRepo: jest.Mocked<ITagRepository> = {
      findAll: jest.fn(),
      findEventTagsMap: jest.fn(),
      findTagsForEvento: jest.fn(),
    };
    return { service: new EventsService(repo, tagRepo), repo, tagRepo };
  }

  it('retorna array vazio sem erro quando não há eventos publicados', async () => {
    const { service, repo } = createService();
    repo.findPublished.mockResolvedValue([]);

    await expect(service.getPublished()).resolves.toEqual([]);
  });

  it('repassa o objeto de filtros (limit/offset/cidade/modalidade) para o repositório', async () => {
    const { service, repo } = createService();
    repo.findPublished.mockResolvedValue([]);

    await service.getPublished({
      limit: 5,
      offset: 10,
      cidade: 'São Paulo',
      modalidade: 'Online',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
    expect(repo.findPublished).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
      cidade: 'São Paulo',
      modalidade: 'Online',
    });
  });

  it('funciona sem nenhum filtro informado', async () => {
    const { service, repo } = createService();
    repo.findPublished.mockResolvedValue([]);

    await service.getPublished();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
    expect(repo.findPublished).toHaveBeenCalledWith(undefined);
  });

  it('mapeia cada entidade para o DTO público, omitindo campos internos', async () => {
    const { service, repo } = createService();
    repo.findPublished.mockResolvedValue([
      buildEvento({
        status: 'rascunho',
        motivo_recusa: 'x',
        created_by: 'uuid-autor',
      }),
    ]);

    const result = await service.getPublished();

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('status');
    expect(result[0]).not.toHaveProperty('created_by');
    expect(result[0]).not.toHaveProperty('motivo_recusa');
    expect(result[0]).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'meetup-cafe-bugado',
      nome: 'Meetup Café Bugado',
    });
  });

  describe('getFeatured', () => {
    it('retorna array vazio sem erro quando não há eventos publicados', async () => {
      const { service, repo } = createService();
      repo.findFeatured.mockResolvedValue([]);

      await expect(service.getFeatured(3)).resolves.toEqual([]);
    });

    it('repassa o limit para o repositório', async () => {
      const { service, repo } = createService();
      repo.findFeatured.mockResolvedValue([]);

      await service.getFeatured(5);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(repo.findFeatured).toHaveBeenCalledWith(5);
    });

    it('usa 3 como limit quando nenhum é informado', async () => {
      const { service, repo } = createService();
      repo.findFeatured.mockResolvedValue([]);

      await service.getFeatured();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(repo.findFeatured).toHaveBeenCalledWith(3);
    });

    it('mapeia cada entidade para o DTO enxuto, só com os 8 campos', async () => {
      const { service, repo } = createService();
      repo.findFeatured.mockResolvedValue([buildEventoFeatured()]);

      const result = await service.getFeatured();

      expect(result).toHaveLength(1);
      expect(Object.keys(result[0]).sort()).toEqual(
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
  });

  describe('getBySlugOrId', () => {
    it('repassa o slugOrId para o repositório', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());

      await service.getBySlugOrId('meetup-cafe-bugado');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(repo.findBySlugOrId).toHaveBeenCalledWith('meetup-cafe-bugado');
    });

    it('mapeia a entidade encontrada para o DTO público, omitindo campos internos', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(
        buildEvento({
          status: 'rascunho',
          motivo_recusa: 'x',
          created_by: 'uuid-autor',
        }),
      );

      const result = await service.getBySlugOrId('meetup-cafe-bugado');

      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('motivo_recusa');
      expect(result).toMatchObject({
        id: '11111111-1111-1111-1111-111111111111',
        slug: 'meetup-cafe-bugado',
        nome: 'Meetup Café Bugado',
      });
    });

    it('lança NotFoundException quando o repositório retorna null', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(null);

      await expect(service.getBySlugOrId('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getEventTags', () => {
    it('lança NotFoundException quando o evento não existe/não está publicado', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(null);

      await expect(service.getEventTags('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('verifica a existência do evento antes de buscar as tags', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());
      tagRepo.findTagsForEvento.mockResolvedValue([]);

      await service.getEventTags('11111111-1111-1111-1111-111111111111');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(repo.findBySlugOrId).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
      );
    });

    it('retorna array vazio quando o evento não tem nenhuma tag', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());
      tagRepo.findTagsForEvento.mockResolvedValue([]);

      await expect(service.getEventTags('evento-1')).resolves.toEqual([]);
    });

    it('mapeia as tags do evento para o DTO (id/nome/cor)', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());
      tagRepo.findTagsForEvento.mockResolvedValue([buildTag()]);

      const result = await service.getEventTags('evento-1');

      expect(result).toEqual([
        {
          id: '44444444-4444-4444-4444-444444444444',
          nome: 'Backend',
          cor: '#2563eb',
        },
      ]);
    });
  });

  describe('getDetailBySlugOrId', () => {
    it('lança NotFoundException quando o evento não existe/não está publicado', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(null);

      await expect(service.getDetailBySlugOrId('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('busca as tags usando o id real do evento (não o slugOrId recebido)', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());
      tagRepo.findTagsForEvento.mockResolvedValue([]);

      await service.getDetailBySlugOrId('meetup-cafe-bugado');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(tagRepo.findTagsForEvento).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
      );
    });

    it('compõe evento (DTO público) + tags (DTO de tag) num único envelope', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(
        buildEvento({
          status: 'rascunho',
          motivo_recusa: 'x',
          created_by: 'uuid-autor',
        }),
      );
      tagRepo.findTagsForEvento.mockResolvedValue([buildTag()]);

      const result = await service.getDetailBySlugOrId('meetup-cafe-bugado');

      expect(result.evento).not.toHaveProperty('status');
      expect(result.evento).not.toHaveProperty('created_by');
      expect(result.evento).not.toHaveProperty('motivo_recusa');
      expect(result.evento).toMatchObject({
        id: '11111111-1111-1111-1111-111111111111',
        slug: 'meetup-cafe-bugado',
      });
      expect(result.tags).toEqual([
        {
          id: '44444444-4444-4444-4444-444444444444',
          nome: 'Backend',
          cor: '#2563eb',
        },
      ]);
    });

    it('retorna tags vazias sem lançar quando o lookup de tags falha (degradação graciosa)', async () => {
      const { service, repo, tagRepo } = createService();
      repo.findBySlugOrId.mockResolvedValue(buildEvento());
      tagRepo.findTagsForEvento.mockRejectedValue(new Error('falha no banco'));

      const result = await service.getDetailBySlugOrId('meetup-cafe-bugado');

      expect(result.tags).toEqual([]);
      expect(result.evento).toMatchObject({ slug: 'meetup-cafe-bugado' });
    });
  });

  describe('getUpcoming', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('busca os eventos a partir do hoje de Brasília e repassa os filtros', async () => {
      // 02:30 UTC de 02/10 = 23:30 de 01/10 em Brasília.
      jest.useFakeTimers().setSystemTime(new Date('2026-10-02T02:30:00.000Z'));
      const { service, repo } = createService();
      repo.findUpcoming.mockResolvedValue([]);

      await service.getUpcoming({ limit: 10, offset: 20 });

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(repo.findUpcoming).toHaveBeenCalledWith(
        new Date('2026-10-01T00:00:00.000Z'),
        { limit: 10, offset: 20 },
      );
    });

    it('mapeia para o DTO público, sem campos internos de moderação', async () => {
      const { service, repo } = createService();
      repo.findUpcoming.mockResolvedValue([buildEvento({ id: 'futuro' })]);

      const [dto] = await service.getUpcoming();

      expect(dto.id).toBe('futuro');
      expect(dto).not.toHaveProperty('status');
      expect(dto).not.toHaveProperty('created_by');
      expect(dto).not.toHaveProperty('motivo_recusa');
    });
  });

  describe('getRecommended', () => {
    type Mocks = ReturnType<typeof createService>;

    /**
     * Prepara os três acessos de `getRecommended`: candidatos (id, data e ids
     * das tags), tags do evento atual e os dados completos dos escolhidos —
     * estes devolvidos em ordem invertida, para provar que quem ordena é o
     * ranking, não o banco.
     */
    function mockRecommendationData(
      { repo, tagRepo }: Mocks,
      current: Evento,
      others: Evento[],
      tagIdsByEvento: Record<string, string[]> = {},
    ): void {
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findRecommendationCandidates.mockResolvedValue(
        others.map((evento) => ({
          id: evento.id,
          data_evento: evento.data_evento,
          tag_ids: tagIdsByEvento[evento.id] ?? [],
        })),
      );
      tagRepo.findTagsForEvento.mockResolvedValue(
        (tagIdsByEvento[current.id] ?? []).map((id) => buildTag({ id })),
      );
      repo.findFeaturedByIds.mockImplementation((ids) =>
        Promise.resolve(
          others.filter((evento) => ids.includes(evento.id)).reverse(),
        ),
      );
    }

    function buildCurrent(overrides: Partial<Evento> = {}): Evento {
      return buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
        ...overrides,
      });
    }

    it('lança NotFoundException quando o evento atual não existe/não está publicado', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(null);

      await expect(service.getRecommended('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('eventos com tag em comum aparecem antes dos sem tag em comum, mesmo mais distantes', async () => {
      const mocks = createService();
      const withTag = buildEvento({
        id: 'with-tag',
        data_evento: daysFromNow(20),
      });
      const withoutTag = buildEvento({
        id: 'without-tag',
        data_evento: daysFromNow(2),
      });
      mockRecommendationData(mocks, buildCurrent(), [withoutTag, withTag], {
        current: ['tag-1'],
        'with-tag': ['tag-1'],
        'without-tag': ['tag-2'],
      });

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['with-tag', 'without-tag']);
    });

    it('sem tag em comum, evento da mesma semana ISO vem antes de um mais próximo de hoje', async () => {
      const mocks = createService();
      const current = buildCurrent({ data_evento: daysFromNow(21) });
      const sameWeek = buildEvento({
        id: 'same-week',
        data_evento: current.data_evento,
      });
      const nearer = buildEvento({ id: 'nearer', data_evento: daysFromNow(1) });
      mockRecommendationData(mocks, current, [nearer, sameWeek]);

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['same-week', 'nearer']);
    });

    it('evento sem nenhuma tag cadastrada ainda recebe recomendações (fallback por proximidade)', async () => {
      const mocks = createService();
      const near = buildEvento({ id: 'near', data_evento: daysFromNow(10) });
      const far = buildEvento({ id: 'far', data_evento: daysFromNow(30) });
      mockRecommendationData(mocks, buildCurrent(), [far, near]);

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['near', 'far']);
    });

    it('considera todos os candidatos: o melhor aparece mesmo sendo o último de 150', async () => {
      const mocks = createService();
      const others = Array.from({ length: 149 }, (_, i) =>
        buildEvento({ id: `e${i}`, data_evento: daysFromNow(10 + i) }),
      );
      const best = buildEvento({ id: 'best', data_evento: daysFromNow(200) });
      mockRecommendationData(mocks, buildCurrent(), [...others, best], {
        current: ['tag-1'],
        best: ['tag-1'],
      });

      const result = await mocks.service.getRecommended('current');

      expect(result[0].id).toBe('best');
    });

    it('pede ao repositório os eventos futuros, excluindo o próprio evento pelo id', async () => {
      const mocks = createService();
      mockRecommendationData(mocks, buildCurrent({ id: 'uuid-do-evento' }), []);

      await mocks.service.getRecommended('slug-do-evento');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(mocks.repo.findRecommendationCandidates).toHaveBeenCalledWith(
        expect.any(Date),
        'uuid-do-evento',
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(mocks.tagRepo.findTagsForEvento).toHaveBeenCalledWith(
        'uuid-do-evento',
      );
    });

    describe('virada do dia no fuso de Brasília', () => {
      afterEach(() => {
        jest.useRealTimers();
      });

      it.each([
        // 02:30 UTC de 02/10 = 23:30 de 01/10 em Brasília: o dia já virou em UTC.
        ['às 23h30 de Brasília', '2026-10-02T02:30:00.000Z', '2026-10-01'],
        // 03:00 UTC de 02/10 = 00:00 de 02/10 em Brasília.
        ['à meia-noite de Brasília', '2026-10-02T03:00:00.000Z', '2026-10-02'],
      ])(
        '%s, busca candidatos a partir do dia certo',
        async (_descricao, agora, hojeEsperado) => {
          jest.useFakeTimers().setSystemTime(new Date(agora));
          const mocks = createService();
          mockRecommendationData(
            mocks,
            buildCurrent({ data_evento: '10/10/2026' }),
            [],
          );

          await mocks.service.getRecommended('current');

          // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
          expect(mocks.repo.findRecommendationCandidates).toHaveBeenCalledWith(
            new Date(`${hojeEsperado}T00:00:00.000Z`),
            'current',
          );
        },
      );

      it('às 23h30 de Brasília, o evento de hoje é o mais próximo (0 dias)', async () => {
        jest
          .useFakeTimers()
          .setSystemTime(new Date('2026-10-02T02:30:00.000Z'));
        const mocks = createService();
        const hoje = buildEvento({ id: 'hoje', data_evento: '01/10/2026' });
        const amanha = buildEvento({ id: 'amanha', data_evento: '02/10/2026' });
        mockRecommendationData(
          mocks,
          buildCurrent({ data_evento: '20/11/2026' }),
          [amanha, hoje],
        );

        const result = await mocks.service.getRecommended('current');

        expect(result.map((e) => e.id)).toEqual(['hoje', 'amanha']);
      });
    });

    it('ignora candidato com data de calendário inválida', async () => {
      const mocks = createService();
      const invalida = buildEvento({
        id: 'invalida',
        data_evento: '31/02/2099',
      });
      const valida = buildEvento({ id: 'valida', data_evento: daysFromNow(5) });
      mockRecommendationData(mocks, buildCurrent(), [invalida, valida]);

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['valida']);
    });

    it('retorna array vazio quando não há candidatos', async () => {
      const mocks = createService();
      mockRecommendationData(mocks, buildCurrent(), []);

      await expect(mocks.service.getRecommended('current')).resolves.toEqual(
        [],
      );
    });

    it('respeita o limit customizado', async () => {
      const mocks = createService();
      const others = [2, 3, 4, 5].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      mockRecommendationData(mocks, buildCurrent(), others);

      const result = await mocks.service.getRecommended('current', 2);

      expect(result.map((e) => e.id)).toEqual(['e2', 'e3']);
    });

    it('usa 3 como limit default quando não informado', async () => {
      const mocks = createService();
      const others = [2, 3, 4, 5, 6].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      mockRecommendationData(mocks, buildCurrent(), others);

      const result = await mocks.service.getRecommended('current');

      expect(result).toHaveLength(3);
    });

    it('retorna menos que o limit quando não há candidatos suficientes, sem erro', async () => {
      const mocks = createService();
      const only = buildEvento({ id: 'only', data_evento: daysFromNow(2) });
      mockRecommendationData(mocks, buildCurrent(), [only]);

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['only']);
    });

    it('nunca retorna mais que 10, mesmo se um limit maior for pedido', async () => {
      const mocks = createService();
      const others = Array.from({ length: 12 }, (_, i) =>
        buildEvento({ id: `e${i}`, data_evento: daysFromNow(i + 2) }),
      );
      mockRecommendationData(mocks, buildCurrent(), others);

      const result = await mocks.service.getRecommended('current', 999);

      expect(result).toHaveLength(10);
    });

    it('usa ao menos 1, mesmo se um limit menor que 1 for pedido', async () => {
      const mocks = createService();
      const others = [2, 3].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      mockRecommendationData(mocks, buildCurrent(), others);

      const result = await mocks.service.getRecommended('current', 0);

      expect(result.map((e) => e.id)).toEqual(['e2']);
    });

    it('lê os dados completos só dos escolhidos, sem a lista de publicados nem o mapa de tags', async () => {
      const mocks = createService();
      const others = [2, 3, 4, 5, 6].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      mockRecommendationData(mocks, buildCurrent(), others);

      await mocks.service.getRecommended('current', 2);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(mocks.repo.findFeaturedByIds).toHaveBeenCalledWith(['e2', 'e3']);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(mocks.repo.findPublished).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.fn() em interface, não é um método de classe real
      expect(mocks.tagRepo.findEventTagsMap).not.toHaveBeenCalled();
    });

    it('ignora um escolhido que saiu do ar entre o ranking e a leitura dos dados', async () => {
      const mocks = createService();
      const fica = buildEvento({ id: 'fica', data_evento: daysFromNow(3) });
      const saiu = buildEvento({ id: 'saiu', data_evento: daysFromNow(2) });
      mockRecommendationData(mocks, buildCurrent(), [saiu, fica]);
      mocks.repo.findFeaturedByIds.mockResolvedValue([fica]);

      const result = await mocks.service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['fica']);
    });

    it('mapeia os escolhidos para o DTO enxuto (8 campos, mesmo shape de /events/featured)', async () => {
      const mocks = createService();
      const candidate = buildEvento({
        id: 'candidate',
        data_evento: daysFromNow(2),
      });
      mockRecommendationData(mocks, buildCurrent(), [candidate]);

      const result = await mocks.service.getRecommended('current');

      expect(Object.keys(result[0]).sort()).toEqual(
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
  });

  describe('getStats', () => {
    it('repassa o total resolvido pelo repositório no DTO', async () => {
      const { service, repo } = createService();
      repo.countPublished.mockResolvedValue(42);

      const result = await service.getStats();

      expect(result).toEqual({ totalEventos: 42 });
    });

    it('retorna zero sem erro quando não há eventos publicados', async () => {
      const { service, repo } = createService();
      repo.countPublished.mockResolvedValue(0);

      await expect(service.getStats()).resolves.toEqual({ totalEventos: 0 });
    });
  });
});
