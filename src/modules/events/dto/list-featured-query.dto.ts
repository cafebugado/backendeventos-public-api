import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListFeaturedQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 10,
    default: 3,
    description:
      'Quantidade de eventos em destaque a retornar (últimos cadastrados).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 3;
}
