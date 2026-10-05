import { Injectable } from '@nestjs/common';
import { Evento } from '@prisma/client';
import {
  SAFE_LIST_LIMIT,
  UPCOMING_LIST_LIMIT,
} from '../../../common/constants/pagination';
import { toSortableDateKey } from '../../../common/utils/event-date.util';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EventoFeaturedFields,
  EventoPublicFields,
  FindPublishedFilters,
  FindUpcomingFilters,
  IEventoRepository,
} from './evento.repository.interface';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(filters: FindPublishedFilters = {}): Promise<Evento[]> {
    const { cidade, modalidade, limit, offset } = filters;
    return this.prisma.evento.findMany({
      where: {
        status: 'publicado',
        ...(cidade && { cidade: { equals: cidade, mode: 'insensitive' } }),
        ...(modalidade && {
          modalidade: { equals: modalidade, mode: 'insensitive' },
        }),
      },
      orderBy: { created_at: 'desc' },
      take: limit ?? SAFE_LIST_LIMIT,
      skip: offset,
    });
  }

  findFeatured(limit: number): Promise<EventoFeaturedFields[]> {
    return this.prisma.evento.findMany({
      where: { status: 'publicado' },
      orderBy: { created_at: 'desc' },
      take: limit,
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
  }

  /**
   * `data_evento` é TEXT em "DD/MM/YYYY", então o Prisma não consegue filtrar
   * nem ordenar por data: a consulta é SQL parametrizado (somente leitura).
   *
   * A comparação usa a data rearranjada como texto "YYYYMMDD" em vez de
   * `to_date()`: `substr` nunca lança erro, enquanto `to_date('31/02/2026')`
   * derrubaria a consulta inteira por causa de uma linha. A regex descarta o
   * que não tem formato de data, para lixo não entrar na ordenação.
   */
  findUpcoming(
    today: Date,
    filters: FindUpcomingFilters = {},
  ): Promise<EventoPublicFields[]> {
    const todayKey = toSortableDateKey(today);
    const limit = filters.limit ?? UPCOMING_LIST_LIMIT;
    const offset = filters.offset ?? 0;

    return this.prisma.$queryRaw<EventoPublicFields[]>`
      SELECT id, slug, nome, descricao, data_evento, horario, dia_semana,
             periodo, modalidade, endereco, cidade, estado, link, imagem,
             created_at, updated_at
      FROM eventos
      WHERE status = 'publicado'
        AND data_evento ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$'
        AND substr(data_evento, 7, 4) || substr(data_evento, 4, 2) || substr(data_evento, 1, 2) >= ${todayKey}
      ORDER BY substr(data_evento, 7, 4) || substr(data_evento, 4, 2) || substr(data_evento, 1, 2),
               horario,
               id
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  findBySlugOrId(slugOrId: string): Promise<Evento | null> {
    const isUuid = UUID_REGEX.test(slugOrId);
    return this.prisma.evento.findFirst({
      where: {
        status: 'publicado',
        OR: [{ slug: slugOrId }, ...(isUuid ? [{ id: slugOrId }] : [])],
      },
    });
  }

  countPublished(): Promise<number> {
    return this.prisma.evento.count({ where: { status: 'publicado' } });
  }
}
