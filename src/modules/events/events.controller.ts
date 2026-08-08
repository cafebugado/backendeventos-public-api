import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { EventPublicResponseDto } from './dto/event-public-response.dto';
import { EventFeaturedResponseDto } from './dto/event-featured-response.dto';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';
import { ListFeaturedQueryDto } from './dto/list-featured-query.dto';
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
    return this.eventsService.getPublished(query.limit, query.offset);
  }

  @Get('featured')
  @ApiOkResponse({ type: EventFeaturedResponseDto, isArray: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findFeatured(
    @Query() query: ListFeaturedQueryDto,
  ): Promise<EventFeaturedResponseDto[]> {
    return this.eventsService.getFeatured(query.limit);
  }
}
