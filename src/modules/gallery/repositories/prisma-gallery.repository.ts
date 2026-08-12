import { Injectable } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  GaleriaAlbumWithRelations,
  IGalleryRepository,
} from './gallery.repository.interface';

@Injectable()
export class PrismaGalleryRepository implements IGalleryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAlbumsPublic(): Promise<GaleriaAlbumWithRelations[]> {
    return this.prisma.galeriaAlbum.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        created_by: true,
        evento: { select: { nome: true, data_evento: true } },
        comunidade: { select: { nome: true } },
        fotos: {
          orderBy: [{ ordem: 'asc' }, { created_at: 'asc' }],
          select: {
            id: true,
            url: true,
            legenda: true,
            ordem: true,
            uploaded_by: true,
            created_at: true,
          },
        },
      },
    });
  }

  findUserProfilesByIds(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.userProfile.findMany({
      where: { user_id: { in: userIds } },
    });
  }
}
