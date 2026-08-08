import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListPublishedQueryDto } from './list-published-query.dto';

async function validateQuery(raw: Record<string, string>) {
  const instance = plainToInstance(ListPublishedQueryDto, raw);
  return validate(instance);
}

describe('ListPublishedQueryDto', () => {
  it('aceita ausência total de query params (limit undefined, offset default 0)', async () => {
    const instance = plainToInstance(ListPublishedQueryDto, {});
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.limit).toBeUndefined();
    expect(instance.offset).toBe(0);
  });

  it('aceita limit dentro do intervalo 1-100', async () => {
    const errors = await validateQuery({ limit: '50' });
    expect(errors).toHaveLength(0);
  });

  it('rejeita limit igual a 0 (abaixo do mínimo)', async () => {
    const errors = await validateQuery({ limit: '0' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita limit acima de 100', async () => {
    const errors = await validateQuery({ limit: '101' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita offset negativo', async () => {
    const errors = await validateQuery({ offset: '-1' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('converte limit/offset de string (query param) para número', () => {
    const instance = plainToInstance(ListPublishedQueryDto, {
      limit: '5',
      offset: '10',
    });

    expect(instance.limit).toBe(5);
    expect(instance.offset).toBe(10);
  });

  it('aceita cidade e modalidade como strings', async () => {
    const errors = await validateQuery({
      cidade: 'São Paulo',
      modalidade: 'Online',
    });

    expect(errors).toHaveLength(0);
  });

  it('aceita ausência de cidade/modalidade (ambos opcionais)', async () => {
    const instance = plainToInstance(ListPublishedQueryDto, {});
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.cidade).toBeUndefined();
    expect(instance.modalidade).toBeUndefined();
  });

  it('rejeita cidade acima de 120 caracteres', async () => {
    const errors = await validateQuery({ cidade: 'a'.repeat(121) });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita modalidade acima de 60 caracteres', async () => {
    const errors = await validateQuery({ modalidade: 'a'.repeat(61) });
    expect(errors.length).toBeGreaterThan(0);
  });
});
