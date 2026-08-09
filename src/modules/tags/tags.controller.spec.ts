import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  function createController(): {
    controller: TagsController;
    service: jest.Mocked<Pick<TagsService, 'findAll' | 'getEventTagsMap'>>;
  } {
    const service: jest.Mocked<
      Pick<TagsService, 'findAll' | 'getEventTagsMap'>
    > = {
      findAll: jest.fn(),
      getEventTagsMap: jest.fn(),
    };
    const controller = new TagsController(service as unknown as TagsService);
    return { controller, service };
  }

  it('retorna o array resolvido pelo TagsService.findAll', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1', nome: 'Backend', cor: '#2563eb' }] as never;
    service.findAll.mockResolvedValue(dtos);

    await expect(controller.findAll()).resolves.toBe(dtos);
  });

  it('retorna o objeto resolvido pelo TagsService.getEventTagsMap', async () => {
    const { controller, service } = createController();
    const map = {
      'evento-1': [{ id: '1', nome: 'Backend', cor: '#2563eb' }],
    } as never;
    service.getEventTagsMap.mockResolvedValue(map);

    await expect(controller.getEventTagsMap()).resolves.toBe(map);
  });
});
