import { Evento } from '@prisma/client';
import {
  EventoFeaturedFields,
  IEventoRepository,
} from './repositories/evento.repository.interface';
import { EventsService } from './events.service';

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
  } {
    const repo: jest.Mocked<IEventoRepository> = {
      findPublished: jest.fn(),
      findFeatured: jest.fn(),
    };
    return { service: new EventsService(repo), repo };
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
});
