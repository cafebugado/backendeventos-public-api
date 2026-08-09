import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '@prisma/client';

export class TagResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: String, nullable: true })
  cor!: string | null;

  static fromEntity(entity: Pick<Tag, 'id' | 'nome' | 'cor'>): TagResponseDto {
    const dto = new TagResponseDto();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.cor = entity.cor;
    return dto;
  }
}
