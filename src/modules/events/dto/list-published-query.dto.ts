import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListPublishedQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description:
      'Se omitido, retorna todos os eventos publicados (sem paginação).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Filtra por cidade exata (case-insensitive).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @ApiPropertyOptional({
    maxLength: 60,
    description: 'Filtra por modalidade exata (ex.: "Online", "Presencial").',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  modalidade?: string;
}
