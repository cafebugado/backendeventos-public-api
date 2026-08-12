import { mockDeep } from 'jest-mock-extended';
import { SAFE_LIST_LIMIT } from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaTagRepository } from './prisma-tag.repository';

describe('PrismaTagRepository', () => {
  describe('findAll', () => {
    it('busca todas as tags ordenadas por nome', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.tag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await repo.findAll();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
        take: SAFE_LIST_LIMIT,
      });
    });

    it('retorna a lista resolvida pelo Prisma', async () => {
      const prisma = mockDeep<PrismaService>();
      const tags = [{ id: '1', nome: 'Backend' }] as never;
      prisma.tag.findMany.mockResolvedValue(tags);
      const repo = new PrismaTagRepository(prisma);

      await expect(repo.findAll()).resolves.toBe(tags);
    });
  });

  describe('findEventTagsMap', () => {
    it('busca evento_tags de eventos publicados, incluindo a tag relacionada', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.eventoTag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await repo.findEventTagsMap();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.eventoTag.findMany).toHaveBeenCalledWith({
        where: { evento: { status: 'publicado' } },
        select: { evento_id: true, tag: true },
      });
    });

    it('agrupa as tags por evento_id', async () => {
      const prisma = mockDeep<PrismaService>();
      const tagBackend = { id: 't1', nome: 'Backend' };
      const tagFrontend = { id: 't2', nome: 'Frontend' };
      prisma.eventoTag.findMany.mockResolvedValue([
        { evento_id: 'e1', tag: tagBackend },
        { evento_id: 'e1', tag: tagFrontend },
        { evento_id: 'e2', tag: tagBackend },
      ] as never);
      const repo = new PrismaTagRepository(prisma);

      const result = await repo.findEventTagsMap();

      expect(result).toEqual({
        e1: [tagBackend, tagFrontend],
        e2: [tagBackend],
      });
    });

    it('retorna objeto vazio quando não há nenhuma associação evento-tag', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.eventoTag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await expect(repo.findEventTagsMap()).resolves.toEqual({});
    });
  });

  describe('findTagsForEvento', () => {
    it('busca tags associadas ao evento informado, ordenadas por nome', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.tag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await repo.findTagsForEvento('evento-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { eventoTags: { some: { evento_id: 'evento-1' } } },
        orderBy: { nome: 'asc' },
      });
    });

    it('retorna array vazio quando o evento não tem tags', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.tag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await expect(repo.findTagsForEvento('evento-sem-tags')).resolves.toEqual(
        [],
      );
    });
  });
});
