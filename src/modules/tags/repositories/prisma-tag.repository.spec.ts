import { Prisma } from '@prisma/client';
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
    it('agrega os ids das tags por evento, só de eventos publicados', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      prisma.tag.findMany.mockResolvedValue([]);
      const repo = new PrismaTagRepository(prisma);

      await repo.findEventTagsMap();

      const [query] = prisma.$queryRaw.mock.calls[0] as unknown as [Prisma.Sql];
      expect(query.sql).toContain('array_agg(et.tag_id)');
      expect(query.sql).toContain("e.status = 'publicado'");
      expect(query.sql).toContain('GROUP BY et.evento_id');
    });

    it('monta o mapa evento_id -> tags a partir dos ids agregados', async () => {
      const prisma = mockDeep<PrismaService>();
      const tagBackend = { id: 't1', nome: 'Backend' };
      const tagFrontend = { id: 't2', nome: 'Frontend' };
      prisma.$queryRaw.mockResolvedValue([
        { evento_id: 'e1', tag_ids: ['t1', 't2'] },
        { evento_id: 'e2', tag_ids: ['t1'] },
      ]);
      prisma.tag.findMany.mockResolvedValue([tagBackend, tagFrontend] as never);
      const repo = new PrismaTagRepository(prisma);

      const result = await repo.findEventTagsMap();

      expect(result).toEqual({
        e1: [tagBackend, tagFrontend],
        e2: [tagBackend],
      });
    });

    it('ignora id de tag que não existe mais', async () => {
      const prisma = mockDeep<PrismaService>();
      const tagBackend = { id: 't1', nome: 'Backend' };
      prisma.$queryRaw.mockResolvedValue([
        { evento_id: 'e1', tag_ids: ['t1', 'removida'] },
      ]);
      prisma.tag.findMany.mockResolvedValue([tagBackend] as never);
      const repo = new PrismaTagRepository(prisma);

      await expect(repo.findEventTagsMap()).resolves.toEqual({
        e1: [tagBackend],
      });
    });

    it('retorna objeto vazio quando não há nenhuma associação evento-tag', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      prisma.tag.findMany.mockResolvedValue([]);
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
