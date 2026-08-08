import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';
import { ListFeaturedQueryDto } from './dto/list-featured-query.dto';

describe('EventsController', () => {
  function createController(): {
    controller: EventsController;
    service: jest.Mocked<Pick<EventsService, 'getPublished' | 'getFeatured'>>;
  } {
    const service: jest.Mocked<
      Pick<EventsService, 'getPublished' | 'getFeatured'>
    > = {
      getPublished: jest.fn(),
      getFeatured: jest.fn(),
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
});
