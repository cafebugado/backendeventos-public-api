import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { UPCOMING_LIST_LIMIT } from '../../../common/constants/pagination';

export class ListUpcomingQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: UPCOMING_LIST_LIMIT,
    description: `Se omitido, retorna até ${UPCOMING_LIST_LIMIT} eventos futuros.`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(UPCOMING_LIST_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
