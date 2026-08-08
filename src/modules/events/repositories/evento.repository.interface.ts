import { Evento } from '@prisma/client';

export type EventoFeaturedFields = Pick<
  Evento,
  | 'id'
  | 'slug'
  | 'nome'
  | 'descricao'
  | 'data_evento'
  | 'horario'
  | 'imagem'
  | 'created_at'
>;

export interface FindPublishedFilters {
  cidade?: string;
  modalidade?: string;
  limit?: number;
  offset?: number;
}

export interface IEventoRepository {
  findPublished(filters?: FindPublishedFilters): Promise<Evento[]>;
  findFeatured(limit: number): Promise<EventoFeaturedFields[]>;
}

export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');
