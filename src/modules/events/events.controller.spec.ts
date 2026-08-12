import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';
import { ListFeaturedQueryDto } from './dto/list-featured-query.dto';

describe('EventsController', () => {
  function createController(): {
    controller: EventsController;
    service: jest.Mocked<
      Pick<
        EventsService,
        | 'getPublished'
        | 'getFeatured'
        | 'getBySlugOrId'
        | 'getEventTags'
        | 'getRecommended'
        | 'getDetailBySlugOrId'
        | 'getStats'
      >
    >;
  } {
    const service: jest.Mocked<
      Pick<
        EventsService,
        | 'getPublished'
        | 'getFeatured'
        | 'getBySlugOrId'
        | 'getEventTags'
        | 'getRecommended'
        | 'getDetailBySlugOrId'
        | 'getStats'
      >
    > = {
      getPublished: jest.fn(),
      getFeatured: jest.fn(),
      getBySlugOrId: jest.fn(),
      getEventTags: jest.fn(),
      getRecommended: jest.fn(),
      getDetailBySlugOrId: jest.fn(),
      getStats: jest.fn(),
    };
    const controller = new EventsController(
      service as unknown as EventsService,
    );
    return { controller, service };
  }

  it('repassa o objeto de query inteiro (limit/offset/cidade/modalidade) para o EventsService', async () => {
    const { controller, service } = createController();
    service.getPublished.mockResolvedValue([]);
    const query: ListPublishedQueryDto = {
      limit: 5,
      offset: 10,
      cidade: 'São Paulo',
      modalidade: 'Online',
    };

    await controller.findPublished(query);

    expect(service.getPublished).toHaveBeenCalledWith(query);
  });

  it('retorna o array resolvido pelo EventsService', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1' }] as never;
    service.getPublished.mockResolvedValue(dtos);

    await expect(controller.findPublished({ offset: 0 })).resolves.toBe(dtos);
  });

  it('repassa o limit da query para o EventsService.getFeatured', async () => {
    const { controller, service } = createController();
    service.getFeatured.mockResolvedValue([]);
    const query: ListFeaturedQueryDto = { limit: 5 };

    await controller.findFeatured(query);

    expect(service.getFeatured).toHaveBeenCalledWith(5);
  });

  it('retorna o array resolvido pelo EventsService.getFeatured', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1' }] as never;
    service.getFeatured.mockResolvedValue(dtos);

    await expect(controller.findFeatured({ limit: 3 })).resolves.toBe(dtos);
  });

  it('repassa o slugOrId da rota para o EventsService.getBySlugOrId', async () => {
    const { controller, service } = createController();
    const dto = { id: '1' } as never;
    service.getBySlugOrId.mockResolvedValue(dto);

    await controller.findBySlugOrId('meetup-cafe-bugado');

    expect(service.getBySlugOrId).toHaveBeenCalledWith('meetup-cafe-bugado');
  });

  it('retorna o DTO resolvido pelo EventsService.getBySlugOrId', async () => {
    const { controller, service } = createController();
    const dto = { id: '1', slug: 'meetup-cafe-bugado' } as never;
    service.getBySlugOrId.mockResolvedValue(dto);

    await expect(controller.findBySlugOrId('meetup-cafe-bugado')).resolves.toBe(
      dto,
    );
  });

  it('repassa o eventoId da rota para o EventsService.getEventTags', async () => {
    const { controller, service } = createController();
    service.getEventTags.mockResolvedValue([]);

    await controller.findEventTags('evento-1');

    expect(service.getEventTags).toHaveBeenCalledWith('evento-1');
  });

  it('retorna o array resolvido pelo EventsService.getEventTags', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1', nome: 'Backend', cor: '#2563eb' }] as never;
    service.getEventTags.mockResolvedValue(dtos);

    await expect(controller.findEventTags('evento-1')).resolves.toBe(dtos);
  });

  it('repassa id e limit para o EventsService.getRecommended', async () => {
    const { controller, service } = createController();
    service.getRecommended.mockResolvedValue([]);

    await controller.findRecommended('evento-1', 5);

    expect(service.getRecommended).toHaveBeenCalledWith('evento-1', 5);
  });

  it('repassa undefined quando limit não é informado (EventsService aplica o default)', async () => {
    const { controller, service } = createController();
    service.getRecommended.mockResolvedValue([]);

    await controller.findRecommended('evento-1', undefined);

    expect(service.getRecommended).toHaveBeenCalledWith('evento-1', undefined);
  });

  it('retorna o array resolvido pelo EventsService.getRecommended', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1' }] as never;
    service.getRecommended.mockResolvedValue(dtos);

    await expect(controller.findRecommended('evento-1', 3)).resolves.toBe(dtos);
  });

  it('repassa o slugOrId da rota para o EventsService.getDetailBySlugOrId', async () => {
    const { controller, service } = createController();
    const dto = { evento: { id: '1' }, tags: [] } as never;
    service.getDetailBySlugOrId.mockResolvedValue(dto);

    await controller.findDetailBySlugOrId('meetup-cafe-bugado');

    expect(service.getDetailBySlugOrId).toHaveBeenCalledWith(
      'meetup-cafe-bugado',
    );
  });

  it('retorna o envelope resolvido pelo EventsService.getDetailBySlugOrId', async () => {
    const { controller, service } = createController();
    const dto = { evento: { id: '1' }, tags: [] } as never;
    service.getDetailBySlugOrId.mockResolvedValue(dto);

    await expect(
      controller.findDetailBySlugOrId('meetup-cafe-bugado'),
    ).resolves.toBe(dto);
  });

  it('retorna o DTO resolvido pelo EventsService.getStats', async () => {
    const { controller, service } = createController();
    const dto = { totalEventos: 42 } as never;
    service.getStats.mockResolvedValue(dto);

    await expect(controller.findStats()).resolves.toBe(dto);
    expect(service.getStats).toHaveBeenCalledWith();
  });
});
