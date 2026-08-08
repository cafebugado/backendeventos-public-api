import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';

describe('EventsController', () => {
  function createController(): {
    controller: EventsController;
    service: jest.Mocked<Pick<EventsService, 'getPublished'>>;
  } {
    const service: jest.Mocked<Pick<EventsService, 'getPublished'>> = {
      getPublished: jest.fn(),
    };
    const controller = new EventsController(
      service as unknown as EventsService,
    );
    return { controller, service };
  }

  it('repassa limit e offset da query para o EventsService', async () => {
    const { controller, service } = createController();
    service.getPublished.mockResolvedValue([]);
    const query: ListPublishedQueryDto = { limit: 5, offset: 10 };

    await controller.findPublished(query);

    expect(service.getPublished).toHaveBeenCalledWith(5, 10);
  });

  it('retorna o array resolvido pelo EventsService', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1' }] as never;
    service.getPublished.mockResolvedValue(dtos);

    await expect(controller.findPublished({ offset: 0 })).resolves.toBe(dtos);
  });
});
