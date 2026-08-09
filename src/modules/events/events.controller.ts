import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { ParseOptionalIntPipe } from '../../common/pipes/parse-optional-int.pipe';
import { EventPublicResponseDto } from './dto/event-public-response.dto';
import { EventFeaturedResponseDto } from './dto/event-featured-response.dto';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';
import { ListFeaturedQueryDto } from './dto/list-featured-query.dto';
import { TagResponseDto } from '../tags/dto/tag-response.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
@UseInterceptors(CacheControlInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('published')
  @ApiOkResponse({ type: EventPublicResponseDto, isArray: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findPublished(
    @Query() query: ListPublishedQueryDto,
  ): Promise<EventPublicResponseDto[]> {
    return this.eventsService.getPublished(query);
  }

  @Get('featured')
  @ApiOkResponse({ type: EventFeaturedResponseDto, isArray: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findFeatured(
    @Query() query: ListFeaturedQueryDto,
  ): Promise<EventFeaturedResponseDto[]> {
    return this.eventsService.getFeatured(query.limit);
  }

  @Get('slug/:slugOrId')
  @ApiOkResponse({ type: EventPublicResponseDto })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado ou não publicado',
  })
  findBySlugOrId(
    @Param('slugOrId') slugOrId: string,
  ): Promise<EventPublicResponseDto> {
    return this.eventsService.getBySlugOrId(slugOrId);
  }

  @Get(':eventoId/tags')
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado ou não publicado',
  })
  findEventTags(
    @Param('eventoId') eventoId: string,
  ): Promise<TagResponseDto[]> {
    return this.eventsService.getEventTags(eventoId);
  }

  @Get(':id/recommended')
  @ApiOkResponse({ type: EventFeaturedResponseDto, isArray: true })
  @ApiNotFoundResponse({
    description: 'Evento não encontrado ou não publicado',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRecommended(
    @Param('id') id: string,
    @Query('limit', ParseOptionalIntPipe) limit?: number,
  ): Promise<EventFeaturedResponseDto[]> {
    return this.eventsService.getRecommended(id, limit);
  }
}
