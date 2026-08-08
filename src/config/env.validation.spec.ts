import { validate } from './env.validation';

const VALID_BASE = {
  CORS_ORIGINS: 'http://localhost:3000',
  DATABASE_URL: 'postgresql://user:pass@pooler.example.com:6543/postgres',
  DIRECT_URL: 'postgresql://user:pass@db.example.com:5432/postgres',
};

describe('validate (env.validation)', () => {
  it('aceita configuração válida e faz coerção de PORT para número', () => {
    const result = validate({ ...VALID_BASE, PORT: '4000' });

    expect(result.PORT).toBe(4000);
    expect(result.CORS_ORIGINS).toBe(VALID_BASE.CORS_ORIGINS);
    expect(result.DATABASE_URL).toBe(VALID_BASE.DATABASE_URL);
    expect(result.DIRECT_URL).toBe(VALID_BASE.DIRECT_URL);
  });

  it('aceita configuração sem PORT (opcional)', () => {
    const result = validate({ ...VALID_BASE });

    expect(result.PORT).toBeUndefined();
  });

  it.each(['CORS_ORIGINS', 'DATABASE_URL', 'DIRECT_URL'] as const)(
    'lança erro quando %s está ausente',
    (missingKey) => {
      const rest: Record<string, string> = {};
      for (const [key, value] of Object.entries(VALID_BASE)) {
        if (key !== missingKey) {
          rest[key] = value;
        }
      }
      expect(() => validate(rest)).toThrow(/Variáveis de ambiente inválidas/);
    },
  );

  it('lança erro quando PORT não é um inteiro', () => {
    expect(() => validate({ ...VALID_BASE, PORT: 'abc' })).toThrow();
  });
});
