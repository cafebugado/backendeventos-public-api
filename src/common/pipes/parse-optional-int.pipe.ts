import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Valida um único query param inteiro opcional sem precisar de um DTO
 * completo. Em uso em GET /events/:id/recommended?limit= (events.controller.ts).
 * /events/published valida limit/offset via ListPublishedQueryDto, não este pipe.
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
