import { ApiProperty } from '@nestjs/swagger';
import { EventoFeaturedFields } from '../repositories/evento.repository.interface';

export class EventFeaturedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: String, nullable: true })
  descricao!: string | null;

  @ApiProperty({
    description: 'Formato DD/MM/YYYY — texto livre, não é ISO date',
  })
  data_evento!: string;

  @ApiProperty()
  horario!: string;

  @ApiProperty({ type: String, nullable: true })
  imagem!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  static fromEntity(entity: EventoFeaturedFields): EventFeaturedResponseDto {
    const dto = new EventFeaturedResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.nome = entity.nome;
    dto.descricao = entity.descricao;
    dto.data_evento = entity.data_evento;
    dto.horario = entity.horario;
    dto.imagem = entity.imagem;
    dto.created_at = entity.created_at;
    return dto;
  }
}
