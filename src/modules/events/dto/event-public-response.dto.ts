import { ApiProperty } from '@nestjs/swagger';
import { Evento } from '@prisma/client';

const PERIODOS = ['Matinal', 'Diurno', 'Vespertino', 'Noturno'] as const;

export class EventPublicResponseDto {
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

  @ApiProperty()
  dia_semana!: string;

  @ApiProperty({ type: String, nullable: true, enum: PERIODOS })
  periodo!: string | null;

  @ApiProperty({ type: String, nullable: true })
  modalidade!: string | null;

  @ApiProperty({ type: String, nullable: true })
  endereco!: string | null;

  @ApiProperty({ type: String, nullable: true })
  cidade!: string | null;

  @ApiProperty({ type: String, nullable: true })
  estado!: string | null;

  @ApiProperty()
  link!: string;

  @ApiProperty({ type: String, nullable: true })
  imagem!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at!: Date;

  static fromEntity(entity: Evento): EventPublicResponseDto {
    const dto = new EventPublicResponseDto();
    dto.id = entity.id;
    dto.slug = entity.slug;
    dto.nome = entity.nome;
    dto.descricao = entity.descricao;
    dto.data_evento = entity.data_evento;
    dto.horario = entity.horario;
    dto.dia_semana = entity.dia_semana;
    dto.periodo = entity.periodo;
    dto.modalidade = entity.modalidade;
    dto.endereco = entity.endereco;
    dto.cidade = entity.cidade;
    dto.estado = entity.estado;
    dto.link = entity.link;
    dto.imagem = entity.imagem;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    return dto;
  }
}
