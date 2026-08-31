import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('usa PORT=3000 como default quando a env var não está definida', () => {
    delete process.env.PORT;

    expect(configuration().app.port).toBe(3000);
  });

  it('faz parse de PORT informado', () => {
    process.env.PORT = '4000';

    expect(configuration().app.port).toBe(4000);
  });

  it('retorna array vazio de corsOrigins quando CORS_ORIGINS não está definida', () => {
    delete process.env.CORS_ORIGINS;

    expect(configuration().app.corsOrigins).toEqual([]);
  });

  it('faz split por vírgula e trim de espaços', () => {
    process.env.CORS_ORIGINS = ' http://localhost:3000 , https://example.com ';

    expect(configuration().app.corsOrigins).toEqual([
      'http://localhost:3000',
      'https://example.com',
    ]);
  });

  it('remove barra final de cada origem (Origin do navegador nunca tem trailing slash)', () => {
    process.env.CORS_ORIGINS =
      'https://eventos.cafebugado.com.br/,https://developer-eventos.cafebugado.com.br/';

    expect(configuration().app.corsOrigins).toEqual([
      'https://eventos.cafebugado.com.br',
      'https://developer-eventos.cafebugado.com.br',
    ]);
  });

  it('ignora entradas vazias resultantes de vírgulas repetidas/sobrando', () => {
    process.env.CORS_ORIGINS = 'https://example.com,,http://localhost:3000,';

    expect(configuration().app.corsOrigins).toEqual([
      'https://example.com',
      'http://localhost:3000',
    ]);
  });

  it('swaggerUser/swaggerPassword ficam undefined quando as env vars não estão definidas', () => {
    delete process.env.SWAGGER_USER;
    delete process.env.SWAGGER_PASSWORD;

    expect(configuration().app.swaggerUser).toBeUndefined();
    expect(configuration().app.swaggerPassword).toBeUndefined();
  });

  it('lê swaggerUser/swaggerPassword das env vars quando definidas', () => {
    process.env.SWAGGER_USER = 'admin';
    process.env.SWAGGER_PASSWORD = 'segredo';

    expect(configuration().app.swaggerUser).toBe('admin');
    expect(configuration().app.swaggerPassword).toBe('segredo');
  });
});
