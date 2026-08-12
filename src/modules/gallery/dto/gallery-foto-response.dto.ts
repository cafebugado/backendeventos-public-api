import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '@prisma/client';
import { GaleriaFotoFields } from '../repositories/gallery.repository.interface';
import { resolveProfileName } from './resolve-profile-name';

export class GalleryFotoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ type: String, nullable: true })
  legenda!: string | null;

  @ApiProperty()
  ordem!: number;

  @ApiProperty({ type: String, nullable: true })
  uploaded_by_nome!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  created_at!: Date | null;

  static from(
    foto: GaleriaFotoFields,
    profilesById: Map<string, UserProfile>,
  ): GalleryFotoResponseDto {
    const dto = new GalleryFotoResponseDto();
    dto.id = foto.id;
    dto.url = foto.url;
    dto.legenda = foto.legenda;
    dto.ordem = foto.ordem ?? 0;
    dto.uploaded_by_nome = resolveProfileName(
      foto.uploaded_by ? profilesById.get(foto.uploaded_by) : undefined,
    );
    dto.created_at = foto.created_at;
    return dto;
  }
}
