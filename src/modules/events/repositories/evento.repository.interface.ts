import { Evento } from '@prisma/client';

export interface IEventoRepository {
  findPublished(limit?: number, offset?: number): Promise<Evento[]>;
}

export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');
