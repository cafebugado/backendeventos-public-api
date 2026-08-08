import { Injectable } from '@nestjs/common';
import { Evento } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IEventoRepository } from './evento.repository.interface';

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
}
