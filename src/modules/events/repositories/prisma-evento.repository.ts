import { Injectable } from '@nestjs/common';
import { Evento, Prisma } from '@prisma/client';
import {
  RECOMMENDATION_CANDIDATES_LIMIT,
  SAFE_LIST_LIMIT,
  UPCOMING_LIST_LIMIT,
} from '../../../common/constants/pagination';
import { toSortableDateKey } from '../../../common/utils/event-date.util';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EventoFeaturedFields,
  EventoPublicFields,
  EventoRecommendationCandidate,
  FindPublishedFilters,
  FindUpcomingFilters,
  IEventoRepository,
} from './evento.repository.interface';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FEATURED_SELECT = {
  id: true,
  slug: true,
  nome: true,
  descricao: true,
  data_evento: true,
  horario: true,
  imagem: true,
  created_at: true,
} satisfies Prisma.EventoSelect;

/**
 * `data_evento` é TEXT em "DD/MM/YYYY", então o Prisma não consegue filtrar
 * nem ordenar por data: as consultas de eventos futuros são SQL parametrizado
 * (somente leitura), montadas com os dois trechos abaixo.
 *
 * A comparação usa a data rearranjada como texto "YYYYMMDD" em vez de
 * `to_date()`: `substr` nunca lança erro, enquanto `to_date('31/02/2026')`
 * derrubaria a consulta inteira por causa de uma linha. A regex descarta o que
 * não tem formato de data, para lixo não entrar na ordenação.
 */
const DATA_EVENTO_HAS_DATE_FORMAT = Prisma.sql`data_evento ~ '^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/[0-9]{4}$'`;
const DATA_EVENTO_SORT_KEY = Prisma.sql`substr(data_evento, 7, 4) || substr(data_evento, 4, 2) || substr(data_evento, 1, 2)`;

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
      select: FEATURED_SELECT,
    });
  }

  findFeaturedByIds(ids: string[]): Promise<EventoFeaturedFields[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.evento.findMany({
      where: { id: { in: ids }, status: 'publicado' },
      select: FEATURED_SELECT,
    });
  }

  findUpcoming(
    today: Date,
    filters: FindUpcomingFilters = {},
  ): Promise<EventoPublicFields[]> {
    const todayKey = toSortableDateKey(today);
    const limit = filters.limit ?? UPCOMING_LIST_LIMIT;
    const offset = filters.offset ?? 0;

    return this.prisma.$queryRaw<EventoPublicFields[]>(Prisma.sql`
      SELECT id, slug, nome, descricao, data_evento, horario, dia_semana,
             periodo, modalidade, endereco, cidade, estado, link, imagem,
             created_at, updated_at
      FROM eventos
      WHERE status = 'publicado'
        AND ${DATA_EVENTO_HAS_DATE_FORMAT}
        AND ${DATA_EVENTO_SORT_KEY} >= ${todayKey}
      ORDER BY ${DATA_EVENTO_SORT_KEY}, horario, id
      LIMIT ${limit} OFFSET ${offset}
    `);
  }

  /**
   * Só o necessário para ranquear (id, data e ids das tags) de todos os
   * eventos futuros, numa consulta. As colunas pesadas (`descricao`, `imagem`)
   * são lidas depois, só dos poucos escolhidos (`findFeaturedByIds`).
   */
  findRecommendationCandidates(
    today: Date,
    excludeId: string,
  ): Promise<EventoRecommendationCandidate[]> {
    const todayKey = toSortableDateKey(today);

    return this.prisma.$queryRaw<EventoRecommendationCandidate[]>(Prisma.sql`
      SELECT e.id,
             e.data_evento,
             COALESCE(
               array_agg(et.tag_id) FILTER (WHERE et.tag_id IS NOT NULL),
               '{}'
             ) AS tag_ids
      FROM eventos e
      LEFT JOIN evento_tags et ON et.evento_id = e.id
      WHERE e.status = 'publicado'
        AND e.id <> ${excludeId}::uuid
        AND ${DATA_EVENTO_HAS_DATE_FORMAT}
        AND ${DATA_EVENTO_SORT_KEY} >= ${todayKey}
      GROUP BY e.id
      ORDER BY ${DATA_EVENTO_SORT_KEY}, e.horario, e.id
      LIMIT ${RECOMMENDATION_CANDIDATES_LIMIT}
    `);
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
