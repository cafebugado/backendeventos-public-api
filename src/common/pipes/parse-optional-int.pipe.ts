import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Reservado para endpoints futuros com um único query param inteiro opcional
 * sem um DTO completo (ex.: /events/upcoming?limit=, /events/{id}/recommended?limit=
 * — sprints 3 e 6). Não é usado em /events/published, que valida limit/offset via
 * ListPublishedQueryDto.
 */
@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  transform(value: string | undefined): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(
        `Valor inválido para parâmetro inteiro opcional: "${value}"`,
      );
    }

    return parsed;
  }
}
