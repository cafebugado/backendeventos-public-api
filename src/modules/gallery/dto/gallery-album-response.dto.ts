import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '@prisma/client';
import { GaleriaAlbumWithRelations } from '../repositories/gallery.repository.interface';
import { GalleryFotoResponseDto } from './gallery-foto-response.dto';
import { resolveProfileName } from './resolve-profile-name';

export class GalleryAlbumResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  evento_nome!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Formato DD/MM/YYYY — texto livre, não é ISO date',
  })
  evento_data!: string | null;

  @ApiProperty({ type: String, nullable: true })
  comunidade_nome!: string | null;

  @ApiProperty({ type: String, nullable: true })
  created_by_nome!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  created_at!: Date | null;

  @ApiProperty({ type: GalleryFotoResponseDto, isArray: true })
  fotos!: GalleryFotoResponseDto[];

  static from(
    album: GaleriaAlbumWithRelations,
    profilesById: Map<string, UserProfile>,
  ): GalleryAlbumResponseDto {
    const dto = new GalleryAlbumResponseDto();
    dto.id = album.id;
    dto.evento_nome = album.evento?.nome ?? null;
    dto.evento_data = album.evento?.data_evento ?? null;
    dto.comunidade_nome = album.comunidade?.nome ?? null;
    dto.created_by_nome = resolveProfileName(
      album.created_by ? profilesById.get(album.created_by) : undefined,
    );
    dto.created_at = album.created_at;
    dto.fotos = album.fotos.map((foto) =>
      GalleryFotoResponseDto.from(foto, profilesById),
    );
    return dto;
  }
}
