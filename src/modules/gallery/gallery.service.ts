import { Inject, Injectable } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { GalleryAlbumResponseDto } from './dto/gallery-album-response.dto';
import { GALLERY_REPOSITORY } from './repositories/gallery.repository.interface';
import type { IGalleryRepository } from './repositories/gallery.repository.interface';

@Injectable()
export class GalleryService {
  constructor(
    @Inject(GALLERY_REPOSITORY)
    private readonly galleryRepository: IGalleryRepository,
  ) {}

  async getPublicAlbums(): Promise<GalleryAlbumResponseDto[]> {
    const albums = await this.galleryRepository.findAlbumsPublic();

    const userIds = new Set<string>();
    for (const album of albums) {
      if (album.created_by) {
        userIds.add(album.created_by);
      }
      for (const foto of album.fotos) {
        if (foto.uploaded_by) {
          userIds.add(foto.uploaded_by);
        }
      }
    }

    const profiles = await this.galleryRepository.findUserProfilesByIds([
      ...userIds,
    ]);
    const profilesById = new Map<string, UserProfile>(
      profiles.map((profile) => [profile.user_id, profile]),
    );

    return albums.map((album) =>
      GalleryAlbumResponseDto.from(album, profilesById),
    );
  }
}
