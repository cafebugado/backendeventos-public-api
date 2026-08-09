import { Injectable } from '@nestjs/common';
import { Evento } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EventoFeaturedFields,
  FindPublishedFilters,
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
      take: limit,
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

  findBySlugOrId(slugOrId: string): Promise<Evento | null> {
    const isUuid = UUID_REGEX.test(slugOrId);
    return this.prisma.evento.findFirst({
      where: {
        status: 'publicado',
        OR: [{ slug: slugOrId }, ...(isUuid ? [{ id: slugOrId }] : [])],
      },
    });
  }
}
