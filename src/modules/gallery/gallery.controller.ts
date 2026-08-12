import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { GalleryAlbumResponseDto } from './dto/gallery-album-response.dto';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@Controller('gallery')
@UseInterceptors(CacheControlInterceptor)
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('albums/public')
  @ApiOkResponse({ type: GalleryAlbumResponseDto, isArray: true })
  findPublicAlbums(): Promise<GalleryAlbumResponseDto[]> {
    return this.galleryService.getPublicAlbums();
  }
}
