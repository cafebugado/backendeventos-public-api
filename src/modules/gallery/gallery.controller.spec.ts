import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

describe('GalleryController', () => {
  function createController(): {
    controller: GalleryController;
    service: jest.Mocked<Pick<GalleryService, 'getPublicAlbums'>>;
  } {
    const service: jest.Mocked<Pick<GalleryService, 'getPublicAlbums'>> = {
      getPublicAlbums: jest.fn(),
    };
    const controller = new GalleryController(
      service as unknown as GalleryService,
    );
    return { controller, service };
  }

  it('retorna o array resolvido pelo GalleryService.getPublicAlbums', async () => {
    const { controller, service } = createController();
    const dtos = [{ id: '1', fotos: [] }] as never;
    service.getPublicAlbums.mockResolvedValue(dtos);

    await expect(controller.findPublicAlbums()).resolves.toBe(dtos);
  });
});
