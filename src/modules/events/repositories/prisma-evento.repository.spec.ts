import { Prisma } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import {
  RECOMMENDATION_CANDIDATES_LIMIT,
  SAFE_LIST_LIMIT,
  UPCOMING_LIST_LIMIT,
} from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaEventoRepository } from './prisma-evento.repository';

/** SQL e parâmetros da última chamada a `$queryRaw` (feita com `Prisma.sql`). */
function lastQuery(prisma: DeepMockProxy<PrismaService>): {
  sql: string;
  values: unknown[];
} {
  const [query] = prisma.$queryRaw.mock.calls[0] as unknown as [Prisma.Sql];
  return { sql: query.sql, values: query.values };
}

describe('PrismaEventoRepository', () => {
  it('busca eventos com status publicado, ordenados por created_at desc, com o teto de segurança quando limit é omitido', async () => {
    const prisma = mockDeep<PrismaService>();
    prisma.evento.findMany.mockResolvedValue([]);
    const repo = new PrismaEventoRepository(prisma);

    await repo.findPublished();

    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
    expect(prisma.evento.findMany).toHaveBeenCalledWith({
      where: { status: 'publicado' },
      orderBy: { created_at: 'desc' },
      take: SAFE_LIST_LIMIT,
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
      take: SAFE_LIST_LIMIT,
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
      take: SAFE_LIST_LIMIT,
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

  describe('countPublished', () => {
    it('conta eventos com status publicado', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.count.mockResolvedValue(0);
      const repo = new PrismaEventoRepository(prisma);

      await repo.countPublished();

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.count).toHaveBeenCalledWith({
        where: { status: 'publicado' },
      });
    });

    it('retorna o total resolvido pelo Prisma', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.count.mockResolvedValue(42);
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.countPublished()).resolves.toBe(42);
    });
  });

  describe('findUpcoming', () => {
    const today = new Date('2026-10-05T00:00:00.000Z');

    it('passa hoje como YYYYMMDD e usa o teto próprio quando limit é omitido', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findUpcoming(today);

      expect(lastQuery(prisma).values).toEqual([
        '20261005',
        UPCOMING_LIST_LIMIT,
        0,
      ]);
    });

    it('repassa limit e offset como parâmetros da consulta', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findUpcoming(today, { limit: 20, offset: 40 });

      expect(lastQuery(prisma).values).toEqual(['20261005', 20, 40]);
    });

    it('filtra só publicados, descarta data fora do formato e nunca lê campos internos', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findUpcoming(today);

      const { sql } = lastQuery(prisma);
      expect(sql).toContain("status = 'publicado'");
      expect(sql).toContain('data_evento ~');
      expect(sql).toMatch(/ORDER BY[\s\S]*horario/);
      expect(sql).not.toMatch(/SELECT \*/);
      expect(sql).not.toContain('motivo_recusa');
      expect(sql).not.toContain('created_by');
    });

    it('devolve as linhas retornadas pelo banco', async () => {
      const prisma = mockDeep<PrismaService>();
      const rows = [{ id: '1' }];
      prisma.$queryRaw.mockResolvedValue(rows);
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.findUpcoming(today)).resolves.toBe(rows);
    });
  });

  describe('findRecommendationCandidates', () => {
    const today = new Date('2026-10-05T00:00:00.000Z');
    const excludeId = '11111111-1111-1111-1111-111111111111';

    it('exclui o próprio evento, parte de hoje e aplica o teto de candidatos', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findRecommendationCandidates(today, excludeId);

      expect(lastQuery(prisma).values).toEqual([
        excludeId,
        '20261005',
        RECOMMENDATION_CANDIDATES_LIMIT,
      ]);
    });

    it('lê só id, data e ids das tags de eventos publicados, sem as colunas pesadas', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.$queryRaw.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findRecommendationCandidates(today, excludeId);

      const { sql } = lastQuery(prisma);
      expect(sql).toContain("e.status = 'publicado'");
      expect(sql).toContain('data_evento ~');
      expect(sql).toContain('LEFT JOIN evento_tags');
      expect(sql).toContain('AS tag_ids');
      expect(sql).not.toContain('descricao');
      expect(sql).not.toContain('imagem');
    });

    it('devolve as linhas retornadas pelo banco', async () => {
      const prisma = mockDeep<PrismaService>();
      const rows = [{ id: '1', data_evento: '10/10/2026', tag_ids: [] }];
      prisma.$queryRaw.mockResolvedValue(rows);
      const repo = new PrismaEventoRepository(prisma);

      await expect(
        repo.findRecommendationCandidates(today, excludeId),
      ).resolves.toBe(rows);
    });
  });

  describe('findFeaturedByIds', () => {
    it('busca só os ids pedidos, publicados, com os 8 campos do DTO enxuto', async () => {
      const prisma = mockDeep<PrismaService>();
      prisma.evento.findMany.mockResolvedValue([]);
      const repo = new PrismaEventoRepository(prisma);

      await repo.findFeaturedByIds(['a', 'b']);

      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] }, status: 'publicado' },
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

    it('não vai ao banco quando a lista de ids está vazia', async () => {
      const prisma = mockDeep<PrismaService>();
      const repo = new PrismaEventoRepository(prisma);

      await expect(repo.findFeaturedByIds([])).resolves.toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- mock do jest-mock-extended, não chamada de método real
      expect(prisma.evento.findMany).not.toHaveBeenCalled();
    });
  });
});
