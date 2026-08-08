import { Inject, Injectable } from '@nestjs/common';
import { EventPublicResponseDto } from './dto/event-public-response.dto';
import { EventFeaturedResponseDto } from './dto/event-featured-response.dto';
import { EVENTO_REPOSITORY } from './repositories/evento.repository.interface';
import type {
  FindPublishedFilters,
  IEventoRepository,
} from './repositories/evento.repository.interface';

@Injectable()
export class EventsService {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
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
}
