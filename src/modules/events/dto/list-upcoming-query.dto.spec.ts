import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UPCOMING_LIST_LIMIT } from '../../../common/constants/pagination';
import { ListUpcomingQueryDto } from './list-upcoming-query.dto';

async function validateQuery(raw: Record<string, string>) {
  const instance = plainToInstance(ListUpcomingQueryDto, raw);
  return validate(instance);
}

describe('ListUpcomingQueryDto', () => {
  it('aceita ausência total de query params (limit undefined, offset default 0)', async () => {
    const instance = plainToInstance(ListUpcomingQueryDto, {});
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.limit).toBeUndefined();
    expect(instance.offset).toBe(0);
  });

  it('aceita limit igual ao teto', async () => {
    const errors = await validateQuery({ limit: String(UPCOMING_LIST_LIMIT) });
    expect(errors).toHaveLength(0);
  });

  it('rejeita limit acima do teto', async () => {
    const errors = await validateQuery({
      limit: String(UPCOMING_LIST_LIMIT + 1),
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita limit igual a 0 (abaixo do mínimo)', async () => {
    const errors = await validateQuery({ limit: '0' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita limit não inteiro', async () => {
    const errors = await validateQuery({ limit: '1.5' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita offset negativo', async () => {
    const errors = await validateQuery({ offset: '-1' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('converte limit/offset de string (query param) para número', () => {
    const instance = plainToInstance(ListUpcomingQueryDto, {
      limit: '20',
      offset: '40',
    });

    expect(instance.limit).toBe(20);
    expect(instance.offset).toBe(40);
  });
});
