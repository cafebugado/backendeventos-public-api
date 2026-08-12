import { Injectable } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { SAFE_LIST_LIMIT } from '../../../common/constants/pagination';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  GaleriaAlbumWithRelations,
  IGalleryRepository,
} from './gallery.repository.interface';

@Injectable()
export class PrismaGalleryRepository implements IGalleryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAlbumsPublic(): Promise<GaleriaAlbumWithRelations[]> {
    const albums = await this.prisma.galeriaAlbum.findMany({
      orderBy: { created_at: 'desc' },
      take: SAFE_LIST_LIMIT,
      select: {
        id: true,
        created_at: true,
        created_by: true,
        evento: { select: { nome: true, data_evento: true, status: true } },
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

    // A relação evento->galeriaAlbum não suporta filtro no select do Prisma
    // (é to-one), então o filtro de moderação é aplicado aqui: um evento
    // ainda não publicado não deve vazar nome/data via galeria pública.
    return albums.map((album) => ({
      ...album,
      evento:
        album.evento?.status === 'publicado'
          ? { nome: album.evento.nome, data_evento: album.evento.data_evento }
          : null,
    }));
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
