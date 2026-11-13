import { defineConfig } from 'vitest/config';
import { swcPlugin } from './vitest.config';

/**
 * Testes e2e e de contrato (`test/`). Sobem o AppModule inteiro com o Prisma
 * mockado (ver test/test-app.helper.ts). Para testar contra um Postgres de
 * verdade, use `npm run test:smoke` com o banco local do Docker.
 */
export default defineConfig({
  plugins: [swcPlugin],
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts', 'test/contract.spec.ts'],
    setupFiles: ['reflect-metadata'],
  },
});
