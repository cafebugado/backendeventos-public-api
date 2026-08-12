import { UserProfile } from '@prisma/client';
import { GalleryService } from './gallery.service';
import {
  GaleriaAlbumWithRelations,
  IGalleryRepository,
} from './repositories/gallery.repository.interface';

function buildAlbum(
  overrides: Partial<GaleriaAlbumWithRelations> = {},
): GaleriaAlbumWithRelations {
  return {
    id: 'album-1',
    created_at: new Date('2026-02-01T00:00:00.000Z'),
    created_by: null,
    evento: { nome: 'Meetup Café Bugado', data_evento: '20/02/2026' },
    comunidade: { nome: 'Café Bugado' },
    fotos: [],
    ...overrides,
  };
}

function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    user_id: 'user-1',
    nome: 'Alice',
    sobrenome: 'Souza',
    ...overrides,
  };
}

describe('GalleryService', () => {
  function createService(): {
    service: GalleryService;
    repo: jest.Mocked<IGalleryRepository>;
  } {
    const repo: jest.Mocked<IGalleryRepository> = {
      findAlbumsPublic: jest.fn(),
      findUserProfilesByIds: jest.fn(),
    };
    return { service: new GalleryService(repo), repo };
  }

  describe('getPublicAlbums', () => {
    it('retorna array vazio sem erro quando não há álbuns', async () => {
      const { service, repo } = createService();
      repo.findAlbumsPublic.mockResolvedValue([]);
      repo.findUserProfilesByIds.mockResolvedValue([]);

      await expect(service.getPublicAlbums()).resolves.toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock jest, não chamada de método real
      expect(repo.findUserProfilesByIds).toHaveBeenCalledWith([]);
    });

    it('mapeia álbum e fotos pra DTO, resolvendo evento_nome/evento_data/comunidade_nome', async () => {
      const { service, repo } = createService();
      repo.findAlbumsPublic.mockResolvedValue([
        buildAlbum({
          fotos: [
            {
              id: 'foto-1',
              url: 'https://example.com/1.png',
              legenda: 'Foto 1',
              ordem: 0,
              uploaded_by: null,
              created_at: new Date('2026-02-01T00:00:00.000Z'),
            },
          ],
        }),
      ]);
      repo.findUserProfilesByIds.mockResolvedValue([]);

      const [result] = await service.getPublicAlbums();

      expect(result.evento_nome).toBe('Meetup Café Bugado');
      expect(result.evento_data).toBe('20/02/2026');
      expect(result.comunidade_nome).toBe('Café Bugado');
      expect(result.fotos).toHaveLength(1);
      expect(result.fotos[0].url).toBe('https://example.com/1.png');
    });

    it('resolve created_by_nome/uploaded_by_nome em uma única busca em lote, sem duplicar ids repetidos entre álbum e fotos', async () => {
      const { service, repo } = createService();
      repo.findAlbumsPublic.mockResolvedValue([
        buildAlbum({
          created_by: 'user-1',
          fotos: [
            {
              id: 'foto-1',
              url: 'https://example.com/1.png',
              legenda: null,
              ordem: 0,
              uploaded_by: 'user-1',
              created_at: new Date('2026-02-01T00:00:00.000Z'),
            },
          ],
        }),
      ]);
      repo.findUserProfilesByIds.mockResolvedValue([buildProfile()]);

      const [result] = await service.getPublicAlbums();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock jest, não chamada de método real
      expect(repo.findUserProfilesByIds).toHaveBeenCalledWith(['user-1']);
      expect(result.created_by_nome).toBe('Alice Souza');
      expect(result.fotos[0].uploaded_by_nome).toBe('Alice Souza');
    });

    it('retorna created_by_nome/uploaded_by_nome null quando o profile não existe', async () => {
      const { service, repo } = createService();
      repo.findAlbumsPublic.mockResolvedValue([
        buildAlbum({ created_by: 'user-sem-profile' }),
      ]);
      repo.findUserProfilesByIds.mockResolvedValue([]);

      const [result] = await service.getPublicAlbums();

      expect(result.created_by_nome).toBeNull();
    });

    it('não vaza evento_id/comunidade_id/created_by/uploaded_by/storage_path no DTO', async () => {
      const { service, repo } = createService();
      repo.findAlbumsPublic.mockResolvedValue([
        buildAlbum({
          created_by: 'user-1',
          fotos: [
            {
              id: 'foto-1',
              url: 'https://example.com/1.png',
              legenda: null,
              ordem: 0,
              uploaded_by: 'user-1',
              created_at: new Date('2026-02-01T00:00:00.000Z'),
            },
          ],
        }),
      ]);
      repo.findUserProfilesByIds.mockResolvedValue([buildProfile()]);

      const [result] = await service.getPublicAlbums();

      expect(result).not.toHaveProperty('evento_id');
      expect(result).not.toHaveProperty('comunidade_id');
      expect(result).not.toHaveProperty('created_by');
      expect(result.fotos[0]).not.toHaveProperty('uploaded_by');
      expect(result.fotos[0]).not.toHaveProperty('storage_path');
    });
  });
});
