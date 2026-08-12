import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaGalleryRepository } from './prisma-gallery.repository';

describe('PrismaGalleryRepository', () => {
  describe('findAlbumsPublic', () => {
    it('busca álbuns ordenados por created_at desc, com select otimizado e fotos ordenadas no banco', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.galeriaAlbum.findMany.mockResolvedValue([]);
      const repo = new PrismaGalleryRepository(prisma);

      await repo.findAlbumsPublic();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.galeriaAlbum.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          created_at: true,
          created_by: true,
          evento: { select: { nome: true, data_evento: true } },
          comunidade: { select: { nome: true } },
          fotos: {
            orderBy: [{ ordem: 'asc' }, { created_at: 'asc' }],
            select: {
              id: true,
              url: true,
              legenda: true,
              ordem: true,
              uploaded_by: true,
              created_at: true,
            },
          },
        },
      });
    });

    it('retorna a lista resolvida pelo Prisma', async () => {
      const prisma = mockDeep<PrismaService>();
      const albums = [{ id: '1' }] as never;
      prisma.galeriaAlbum.findMany.mockResolvedValue(albums);
      const repo = new PrismaGalleryRepository(prisma);

      await expect(repo.findAlbumsPublic()).resolves.toBe(albums);
    });
  });

  describe('findUserProfilesByIds', () => {
    it('não consulta o Prisma quando a lista de ids está vazia', async () => {
      const prisma = mockDeep<PrismaService>();
      const repo = new PrismaGalleryRepository(prisma);

      const result = await repo.findUserProfilesByIds([]);

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.userProfile.findMany).not.toHaveBeenCalled();
    });

    it('busca perfis pelos ids informados', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.userProfile.findMany.mockResolvedValue([]);
      const repo = new PrismaGalleryRepository(prisma);

      await repo.findUserProfilesByIds(['u1', 'u2']);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.userProfile.findMany).toHaveBeenCalledWith({
        where: { user_id: { in: ['u1', 'u2'] } },
      });
    });
  });
});
