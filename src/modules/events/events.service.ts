import { Inject, Injectable } from '@nestjs/common';
import { EventPublicResponseDto } from './dto/event-public-response.dto';
import { EventFeaturedResponseDto } from './dto/event-featured-response.dto';
import { EVENTO_REPOSITORY } from './repositories/evento.repository.interface';
import type { IEventoRepository } from './repositories/evento.repository.interface';

@Injectable()
export class EventsService {
  constructor(
    @Inject(EVENTO_REPOSITORY)
    private readonly eventoRepository: IEventoRepository,
  ) {}

  async getPublished(
    limit?: number,
    offset?: number,
  ): Promise<EventPublicResponseDto[]> {
    const eventos = await this.eventoRepository.findPublished(limit, offset);
    return eventos.map((evento) => EventPublicResponseDto.fromEntity(evento));
  }

  async getFeatured(limit = 3): Promise<EventFeaturedResponseDto[]> {
    const eventos = await this.eventoRepository.findFeatured(limit);
    return eventos.map((evento) => EventFeaturedResponseDto.fromEntity(evento));
  }
}
