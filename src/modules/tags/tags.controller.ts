import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller()
@UseInterceptors(CacheControlInterceptor)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tags')
  @ApiOkResponse({ type: TagResponseDto, isArray: true })
  findAll(): Promise<TagResponseDto[]> {
    return this.tagsService.findAll();
  }

  @Get('events/tags-map')
  @ApiOkResponse({
    description:
      'Mapa de tags por evento — chave é o id do evento, valor é o array de tags. Eventos sem nenhuma tag não aparecem como chave.',
  })
  getEventTagsMap(): Promise<Record<string, TagResponseDto[]>> {
    return this.tagsService.getEventTagsMap();
  }
}
