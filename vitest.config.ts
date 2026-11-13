import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 * Testes unitários (`src/**\/*.spec.ts`).
 *
 * O NestJS 12 é publicado só em ESM, e o Jest não consegue carregá-lo a partir
 * deste projeto CommonJS (issue #88). O Vitest carrega ESM nativamente.
 *
 * O SWC substitui o esbuild padrão do Vitest porque o esbuild não emite
 * `emitDecoratorMetadata`, e sem esses metadados a injeção de dependências do
 * Nest não sabe o que injetar nos construtores.
 */
export const swcPlugin = swc.vite({ module: { type: 'es6' } });

// Mesmos gates que existiam no Jest (coverageThreshold): 80% por arquivo nos
// módulos de negócio.
const MODULE_GATE = { statements: 80, functions: 80, lines: 80 };
const gatedModules = ['events', 'tags', 'contributors', 'gallery'];

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['reflect-metadata'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
      thresholds: {
        // No Jest, um gate por glob vale para CADA arquivo que casa com ele.
        perFile: true,
        ...Object.fromEntries(
          gatedModules.flatMap((m) => [
            [`src/modules/${m}/${m}.controller.ts`, MODULE_GATE],
            [`src/modules/${m}/${m}.service.ts`, MODULE_GATE],
            [`src/modules/${m}/dto/**/*.ts`, MODULE_GATE],
            [`src/modules/${m}/repositories/**/*.ts`, MODULE_GATE],
          ]),
        ),
      },
    },
  },
});
