import { Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';
import { SAFE_LIST_LIMIT } from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITagRepository } from './tag.repository.interface';

interface EventoTagIds {
  evento_id: string;
  tag_ids: string[];
}

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { nome: 'asc' },
      take: SAFE_LIST_LIMIT,
    });
  }

  /**
   * Uma linha por evento (com os ids das tags agregados) em vez de uma linha
   * por associação: é a consulta que mais trafega dados do banco, e a forma
   * agregada devolve cerca de metade dos bytes para o mesmo resultado.
   */
  async findEventTagsMap(): Promise<Record<string, Tag[]>> {
    const [rows, tags] = await Promise.all([
      this.prisma.$queryRaw<EventoTagIds[]>(Prisma.sql`
        SELECT et.evento_id, array_agg(et.tag_id) AS tag_ids
        FROM evento_tags et
        JOIN eventos e ON e.id = et.evento_id
        WHERE e.status = 'publicado'
        GROUP BY et.evento_id
      `),
      this.prisma.tag.findMany(),
    ]);

    const tagById = new Map(tags.map((tag) => [tag.id, tag]));
    const map: Record<string, Tag[]> = {};
    for (const row of rows) {
      map[row.evento_id] = row.tag_ids.flatMap((id) => tagById.get(id) ?? []);
    }
    return map;
  }

  findTagsForEvento(eventoId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { eventoTags: { some: { evento_id: eventoId } } },
      orderBy: { nome: 'asc' },
    });
  }
}
