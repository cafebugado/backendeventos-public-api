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

    await repo.findPublished({ limit: 5, offset: 10 });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: { status: 'publicado' },
      orderBy: { created_at: 'desc' },
      take: 5,
      skip: 10,
    });
  });

  it('filtra por cidade (case-insensitive) quando informada', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished({ cidade: 'São Paulo' });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: {
        status: 'publicado',
        cidade: { equals: 'São Paulo', mode: 'insensitive' },
      },
      orderBy: { created_at: 'desc' },
      take: undefined,
      skip: undefined,
    });
  });

  it('filtra por modalidade (case-insensitive) quando informada', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished({ modalidade: 'Online' });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: {
        status: 'publicado',
        modalidade: { equals: 'Online', mode: 'insensitive' },
      },
      orderBy: { created_at: 'desc' },
      take: undefined,
      skip: undefined,
    });
  });

  it('combina cidade, modalidade, limit e offset na mesma query', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished({
      cidade: 'São Paulo',
      modalidade: 'Presencial',
      limit: 5,
      offset: 10,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: {
        status: 'publicado',
        cidade: { equals: 'São Paulo', mode: 'insensitive' },
        modalidade: { equals: 'Presencial', mode: 'insensitive' },
      },
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

  describe('findFeatured', () => {
    it('busca eventos publicados, ordenados por created_at desc, com limit informado', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findMany.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findFeatured(3);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findMany).toHaveBeenCalledWith({
        where: { status: 'publicado' },
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          slug: true,
          nome: true,
          descricao: true,
          data_evento: true,
          horario: true,
          imagem: true,
          created_at: true,
        },
      });
    });

    it('repassa o limit exato para o take (sem hardcode de 3 no repositório)', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findMany.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findFeatured(7);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 7 }),
      );
    });

    it('retorna a lista resolvida pelo Prisma', async () => {
      const prisma = mockDeep<PrismaService>();
      const eventos = [{ id: '1' }] as never;
      prisma.evento.findMany.mockResolvedValue(eventos);
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.findFeatured(3)).resolves.toBe(eventos);
    });
  });

  describe('findBySlugOrId', () => {
    it('busca por slug com status publicado, sem incluir id no OR', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findFirst.mockResolvedValue(null);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findBySlugOrId('meetup-cafe-bugado');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'publicado',
          OR: [{ slug: 'meetup-cafe-bugado' }],
        },
      });
    });

    it('inclui id no OR quando slugOrId é um UUID válido', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findFirst.mockResolvedValue(null);
      const repo = new PrismaEventoRepository(prisma);
      const uuid = '11111111-1111-1111-1111-111111111111';

      await repo.findBySlugOrId(uuid);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'publicado',
          OR: [{ slug: uuid }, { id: uuid }],
        },
      });
    });

    it('não inclui id no OR quando slugOrId não bate com o formato UUID', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findFirst.mockResolvedValue(null);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findBySlugOrId('11111111-1111-1111-1111-11111111111z');

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'publicado',
          OR: [{ slug: '11111111-1111-1111-1111-11111111111z' }],
        },
      });
    });

    it('retorna null quando o Prisma não encontra nada', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findFirst.mockResolvedValue(null);
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.findBySlugOrId('inexistente')).resolves.toBeNull();
    });

    it('retorna o evento resolvido pelo Prisma quando encontrado', async () => {
      const prisma = mockDeep<PrismaService>();
      const evento = { id: '1', slug: 'meetup-cafe-bugado' } as never;
      prisma.evento.findFirst.mockResolvedValue(evento);
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.findBySlugOrId('meetup-cafe-bugado')).resolves.toBe(
        evento,
      );
    });
  });
});
