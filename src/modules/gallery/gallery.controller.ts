import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CACHE_TTL } from '../../common/constants/cache-ttl';
import { CacheTtl } from '../../common/decorators/cache-ttl.decorator';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { GalleryAlbumResponseDto } from './dto/gallery-album-response.dto';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@Controller('gallery')
@UseInterceptors(CacheControlInterceptor)
@CacheTtl(CACHE_TTL.reference)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('albums/public')
  @ApiOkResponse({ type: GalleryAlbumResponseDto, isArray: true })
  findPublicAlbums(): Promise<GalleryAlbumResponseDto[]> {
    return this.galleryService.getPublicAlbums();
  }
}
