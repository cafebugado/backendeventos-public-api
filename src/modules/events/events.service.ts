import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventPublicResponseDto } from './dto/event-public-response.dto';
import { EventFeaturedResponseDto } from './dto/event-featured-response.dto';
import { EventDetailResponseDto } from './dto/event-detail-response.dto';
import { EVENTO_REPOSITORY } from './repositories/evento.repository.interface';
import type {
  FindPublishedFilters,
  IEventoRepository,
} from './repositories/evento.repository.interface';
import { TAG_REPOSITORY } from '../tags/repositories/tag.repository.interface';
import type { ITagRepository } from '../tags/repositories/tag.repository.interface';
import { TagResponseDto } from '../tags/dto/tag-response.dto';
import {
  getIsoWeek,
  getIsoYear,
  parseEventoDate,
} from '../../common/utils/event-date.util';

const MS_PER_DAY = 86_400_000;

function todayAtUtcMidnight(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async getPublished(
    filters?: FindPublishedFilters,
  ): Promise<EventPublicResponseDto[]> {
    const eventos = await this.eventoRepository.findPublished(filters);
    return eventos.map((evento) => EventPublicResponseDto.fromEntity(evento));
  }

  async getFeatured(limit = 3): Promise<EventFeaturedResponseDto[]> {
    const eventos = await this.eventoRepository.findFeatured(limit);
    return eventos.map((evento) => EventFeaturedResponseDto.fromEntity(evento));
  }

  async getBySlugOrId(slugOrId: string): Promise<EventPublicResponseDto> {
    const evento = await this.eventoRepository.findBySlugOrId(slugOrId);
    if (!evento) {
      throw new NotFoundException(`Evento '${slugOrId}' não encontrado`);
    }
    return EventPublicResponseDto.fromEntity(evento);
  }

  async getEventTags(eventoId: string): Promise<TagResponseDto[]> {
    const evento = await this.eventoRepository.findBySlugOrId(eventoId);
    if (!evento) {
      throw new NotFoundException(`Evento '${eventoId}' não encontrado`);
    }
    const tags = await this.tagRepository.findTagsForEvento(eventoId);
    return tags.map((tag) => TagResponseDto.fromEntity(tag));
  }

  async getDetailBySlugOrId(slugOrId: string): Promise<EventDetailResponseDto> {
    const evento = await this.eventoRepository.findBySlugOrId(slugOrId);
    if (!evento) {
      throw new NotFoundException(`Evento '${slugOrId}' não encontrado`);
    }

    let tags: TagResponseDto[] = [];
    try {
      const tagEntities = await this.tagRepository.findTagsForEvento(evento.id);
      tags = tagEntities.map((tag) => TagResponseDto.fromEntity(tag));
    } catch (error) {
      this.logger.error(
        `Falha ao buscar tags do evento '${evento.id}' para o detalhe agregado`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return EventDetailResponseDto.from(
      EventPublicResponseDto.fromEntity(evento),
      tags,
    );
  }

  async getRecommended(
    eventoId: string,
    limit = 3,
  ): Promise<EventFeaturedResponseDto[]> {
    const currentEvent = await this.eventoRepository.findBySlugOrId(eventoId);
    if (!currentEvent) {
      throw new NotFoundException(`Evento '${eventoId}' não encontrado`);
    }

    const [publicados, tagsMap] = await Promise.all([
      this.eventoRepository.findPublished(),
      this.tagRepository.findEventTagsMap(),
    ]);

    const currentTagIds = new Set(
      (tagsMap[currentEvent.id] ?? []).map((tag) => tag.id),
    );
    const currentEventDate = parseEventoDate(currentEvent.data_evento);
    const today = todayAtUtcMidnight();

    const candidates: {
      evento: (typeof publicados)[number];
      hasTagMatch: boolean;
      sameIsoWeek: boolean;
      daysAway: number;
    }[] = [];

    for (const evento of publicados) {
      if (evento.id === currentEvent.id) {
        continue;
      }
      const eventDate = parseEventoDate(evento.data_evento);
      if (!eventDate || eventDate < today) {
        continue;
      }

      const eventoTagIds = (tagsMap[evento.id] ?? []).map((tag) => tag.id);
      const hasTagMatch = eventoTagIds.some((id) => currentTagIds.has(id));
      const sameIsoWeek =
        currentEventDate !== null &&
        getIsoWeek(eventDate) === getIsoWeek(currentEventDate) &&
        getIsoYear(eventDate) === getIsoYear(currentEventDate);
      const daysAway = Math.round(
        (eventDate.getTime() - today.getTime()) / MS_PER_DAY,
      );

      candidates.push({ evento, hasTagMatch, sameIsoWeek, daysAway });
    }

    // Ranking suave (replica evento_service.py:get_recommended_events): tag em
    // comum > mesma semana ISO > mais próximo. Não é um filtro rígido com
    // fallback manual — se faltar candidato com tag em comum, os critérios
    // seguintes preenchem o resto naturalmente.
    candidates.sort((a, b) => {
      if (a.hasTagMatch !== b.hasTagMatch) {
        return a.hasTagMatch ? -1 : 1;
      }
      if (a.sameIsoWeek !== b.sameIsoWeek) {
        return a.sameIsoWeek ? -1 : 1;
      }
      return a.daysAway - b.daysAway;
    });

    // ParseOptionalIntPipe só faz parse de inteiro, sem validar intervalo (é o
    // motivo de existir em vez de um DTO com class-validator) — o clamp fica
    // aqui, na camada de negócio.
    const safeLimit = Math.min(Math.max(limit, 1), 10);

    return candidates
      .slice(0, safeLimit)
      .map(({ evento }) => EventFeaturedResponseDto.fromEntity(evento));
  }
}
