import { mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaEventoRepository } from './prisma-evento.repository';

describe('PrismaEventoRepository', () => {
  it('busca eventos com status publicado, ordenados por created_at desc, sem limit/offset', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: { status: 'publicado' },
      orderBy: { created_at: 'desc' },
      take: undefined,
      skip: undefined,
    });
  });

  it('repassa limit e offset para a query quando informados', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished(5, 10);

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: { status: 'publicado' },
      orderBy: { created_at: 'desc' },
      take: 5,
      skip: 10,
    });
  });

  it('retorna a lista de eventos resolvida pelo Prisma', async () => {
    const prisma = mockDeep<PrismaService>();
    const eventos = [{ id: '1' }] as never;
    prisma.evento.findMany.mockResolvedValue(eventos);
    const repo = new PrismaEventoRepository(prisma);

    await expect(repo.findPublished()).resolves.toBe(eventos);
  });
});
