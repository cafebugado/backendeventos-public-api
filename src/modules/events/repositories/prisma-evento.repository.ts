import { Injectable } from '@nestjs/common';
import { Evento } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  EventoFeaturedFields,
  IEventoRepository,
} from './evento.repository.interface';

@Injectable()
export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(limit?: number, offset?: number): Promise<Evento[]> {
    return this.prisma.evento.findMany({
      where: { status: 'publicado' },
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
}
