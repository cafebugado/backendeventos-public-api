import { NotFoundException } from '@nestjs/common';
import { Evento, Tag } from '@prisma/client';
import {
  EventoFeaturedFields,
  IEventoRepository,
} from './repositories/evento.repository.interface';
import { ITagRepository } from '../tags/repositories/tag.repository.interface';
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

/** "DD/MM/YYYY" relativo a hoje — mantém os testes válidos independente da data de execução. */
function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
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
      findBySlugOrId: jest.fn(),
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

  describe('getRecommended', () => {
    it('lança NotFoundException quando o evento atual não existe/não está publicado', async () => {
      const { service, repo } = createService();
      repo.findBySlugOrId.mockResolvedValue(null);

      await expect(service.getRecommended('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('eventos com tag em comum aparecem antes dos sem tag em comum, mesmo mais distantes', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const withTag = buildEvento({
        id: 'with-tag',
        data_evento: daysFromNow(20),
      });
      const withoutTag = buildEvento({
        id: 'without-tag',
        data_evento: daysFromNow(2),
      });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, withoutTag, withTag]);
      tagRepo.findEventTagsMap.mockResolvedValue({
        current: [buildTag({ id: 'tag-1' })],
        'with-tag': [buildTag({ id: 'tag-1' })],
        'without-tag': [buildTag({ id: 'tag-2' })],
      });

      const result = await service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['with-tag', 'without-tag']);
    });

    it('evento sem nenhuma tag cadastrada ainda recebe recomendações (fallback por proximidade)', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const near = buildEvento({ id: 'near', data_evento: daysFromNow(3) });
      const far = buildEvento({ id: 'far', data_evento: daysFromNow(30) });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, far, near]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['near', 'far']);
    });

    it('exclui eventos passados', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const past = buildEvento({ id: 'past', data_evento: daysFromNow(-5) });
      const upcoming = buildEvento({
        id: 'upcoming',
        data_evento: daysFromNow(3),
      });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, past, upcoming]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['upcoming']);
    });

    it('inclui evento que acontece hoje (não é "passado")', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const today = buildEvento({ id: 'today', data_evento: daysFromNow(0) });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, today]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

      expect(result.map((e) => e.id)).toEqual(['today']);
    });

    it('exclui o próprio evento dos candidatos', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      await expect(service.getRecommended('current')).resolves.toEqual([]);
    });

    it('respeita o limit customizado', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const others = [2, 3, 4, 5].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, ...others]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current', 2);

      expect(result).toHaveLength(2);
    });

    it('usa 3 como limit default quando não informado', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const others = [2, 3, 4, 5, 6].map((n) =>
        buildEvento({ id: `e${n}`, data_evento: daysFromNow(n) }),
      );
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, ...others]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

      expect(result).toHaveLength(3);
    });

    it('retorna menos que o limit quando não há candidatos suficientes, sem erro', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const only = buildEvento({ id: 'only', data_evento: daysFromNow(2) });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, only]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('only');
    });

    it('mapeia os candidatos para o DTO enxuto (8 campos, mesmo shape de /events/featured)', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const candidate = buildEvento({
        id: 'candidate',
        data_evento: daysFromNow(2),
      });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, candidate]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current');

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

    it('nunca retorna mais que 10, mesmo se um limit maior for pedido', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const others = Array.from({ length: 12 }, (_, i) =>
        buildEvento({ id: `e${i}`, data_evento: daysFromNow(i + 2) }),
      );
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, ...others]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current', 999);

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('usa ao menos 1, mesmo se um limit menor que 1 for pedido', async () => {
      const { service, repo, tagRepo } = createService();
      const current = buildEvento({
        id: 'current',
        data_evento: daysFromNow(1),
      });
      const only = buildEvento({ id: 'only', data_evento: daysFromNow(2) });
      repo.findBySlugOrId.mockResolvedValue(current);
      repo.findPublished.mockResolvedValue([current, only]);
      tagRepo.findEventTagsMap.mockResolvedValue({});

      const result = await service.getRecommended('current', 0);

      expect(result).toHaveLength(1);
    });
  });
});
