import type { Mocked } from 'vitest';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

describe('GalleryController', () => {
  function createController(): {
    controller: GalleryController;
    service: Mocked<Pick<GalleryService, 'getPublicAlbums'>>;
  } {
    const service: Mocked<Pick<GalleryService, 'getPublicAlbums'>> = {
      getPublicAlbums: vi.fn(),
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
