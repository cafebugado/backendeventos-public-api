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

/** Os 16 campos expostos pela API pública — sem os internos de moderação. */
export type EventoPublicFields = Pick<
  Evento,
  | 'id'
  | 'slug'
  | 'nome'
  | 'descricao'
  | 'data_evento'
  | 'horario'
  | 'dia_semana'
  | 'periodo'
  | 'modalidade'
  | 'endereco'
  | 'cidade'
  | 'estado'
  | 'link'
  | 'imagem'
  | 'created_at'
  | 'updated_at'
>;

export interface FindUpcomingFilters {
  limit?: number;
  offset?: number;
}

export interface FindPublishedFilters {
  cidade?: string;
  modalidade?: string;
  limit?: number;
  offset?: number;
}

export interface IEventoRepository {
  findPublished(filters?: FindPublishedFilters): Promise<Evento[]>;
  findFeatured(limit: number): Promise<EventoFeaturedFields[]>;
  findUpcoming(
    today: Date,
    filters?: FindUpcomingFilters,
  ): Promise<EventoPublicFields[]>;
  findBySlugOrId(slugOrId: string): Promise<Evento | null>;
  countPublished(): Promise<number>;
}

export const EVENTO_REPOSITORY = Symbol('EVENTO_REPOSITORY');
