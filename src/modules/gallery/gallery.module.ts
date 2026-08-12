import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { GALLERY_REPOSITORY } from './repositories/gallery.repository.interface';
import { PrismaGalleryRepository } from './repositories/prisma-gallery.repository';

@Module({
  controllers: [GalleryController],
  providers: [
    GalleryService,
    {
      provide: GALLERY_REPOSITORY,
      useClass: PrismaGalleryRepository,
    },
  ],
})
export class GalleryModule {}
