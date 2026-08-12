import {
  Comunidade,
  Evento,
  GaleriaAlbum,
  GaleriaFoto,
  UserProfile,
} from '@prisma/client';

export type GaleriaFotoFields = Pick<
  GaleriaFoto,
  'id' | 'url' | 'legenda' | 'ordem' | 'uploaded_by' | 'created_at'
>;

export type GaleriaAlbumWithRelations = Pick<
  GaleriaAlbum,
  'id' | 'created_at' | 'created_by'
> & {
  evento: Pick<Evento, 'nome' | 'data_evento'> | null;
  comunidade: Pick<Comunidade, 'nome'> | null;
  fotos: GaleriaFotoFields[];
};

export interface IGalleryRepository {
  findAlbumsPublic(): Promise<GaleriaAlbumWithRelations[]>;
  findUserProfilesByIds(userIds: string[]): Promise<UserProfile[]>;
}

export const GALLERY_REPOSITORY = Symbol('GALLERY_REPOSITORY');
