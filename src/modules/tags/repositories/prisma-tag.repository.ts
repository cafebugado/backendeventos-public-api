import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { SAFE_LIST_LIMIT } from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITagRepository } from './tag.repository.interface';

@Injectable()
export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      orderBy: { nome: 'asc' },
      take: SAFE_LIST_LIMIT,
    });
  }

  async findEventTagsMap(): Promise<Record<string, Tag[]>> {
    const rows = await this.prisma.eventoTag.findMany({
      where: { evento: { status: 'publicado' } },
      select: { evento_id: true, tag: true },
    });

    const map: Record<string, Tag[]> = {};
    for (const row of rows) {
      (map[row.evento_id] ??= []).push(row.tag);
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
