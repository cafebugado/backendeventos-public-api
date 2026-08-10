import { ApiProperty } from '@nestjs/swagger';
import { Contribuinte } from '@prisma/client';

export class ContributorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  avatar_url!: string;

  @ApiProperty()
  github_url!: string;

  @ApiProperty({ type: String, nullable: true })
  linkedin_url!: string | null;

  @ApiProperty({ type: String, nullable: true })
  portfolio_url!: string | null;

  static fromEntity(entity: Contribuinte): ContributorResponseDto {
    const dto = new ContributorResponseDto();
    dto.id = entity.id;
    dto.nome = entity.nome;
    dto.avatar_url = entity.avatar_url;
    dto.github_url = entity.github_url;
    dto.linkedin_url = entity.linkedin_url;
    dto.portfolio_url = entity.portfolio_url;
    return dto;
  }
}
