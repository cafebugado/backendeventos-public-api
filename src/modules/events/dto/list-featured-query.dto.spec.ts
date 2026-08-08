import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListFeaturedQueryDto } from './list-featured-query.dto';

async function validateQuery(raw: Record<string, string>) {
  const instance = plainToInstance(ListFeaturedQueryDto, raw);
  return validate(instance);
}

describe('ListFeaturedQueryDto', () => {
  it('aceita ausência total de query params (limit default 3)', async () => {
    const instance = plainToInstance(ListFeaturedQueryDto, {});
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.limit).toBe(3);
  });

  it('aceita limit dentro do intervalo 1-10', async () => {
    const errors = await validateQuery({ limit: '5' });
    expect(errors).toHaveLength(0);
  });

  it('rejeita limit igual a 0 (abaixo do mínimo)', async () => {
    const errors = await validateQuery({ limit: '0' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita limit acima de 10', async () => {
    const errors = await validateQuery({ limit: '11' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('converte limit de string (query param) para número', () => {
    const instance = plainToInstance(ListFeaturedQueryDto, { limit: '7' });

    expect(instance.limit).toBe(7);
  });
});
