import { mockDeep } from 'jest-mock-extended';
import { SAFE_LIST_LIMIT } from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaContributorRepository } from './prisma-contributor.repository';

describe('PrismaContributorRepository', () => {
  describe('findAll', () => {
    it('busca todos os contribuintes ordenados por nome', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.contribuinte.findMany.mockResolvedValue([]);
      const repo = new PrismaContributorRepository(prisma);

      await repo.findAll();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.contribuinte.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
        take: SAFE_LIST_LIMIT,
      });
    });

    it('retorna a lista resolvida pelo Prisma', async () => {
      const prisma = mockDeep<PrismaService>();
      const contribuintes = [{ id: '1', nome: 'Alice' }] as never;
      prisma.contribuinte.findMany.mockResolvedValue(contribuintes);
      const repo = new PrismaContributorRepository(prisma);

      await expect(repo.findAll()).resolves.toBe(contribuintes);
    });
  });
});
