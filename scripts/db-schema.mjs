#!/usr/bin/env node
// Gera docker/postgres/init/01-schema.sql a partir do prisma/schema.prisma.
//
//   node scripts/db-schema.mjs          → (re)escreve o arquivo
//   node scripts/db-schema.mjs --check  → só compara; sai com código 1 se o
//                                         arquivo estiver desatualizado (CI)
//
// Não acessa banco nenhum: `prisma migrate diff --from-empty` só lê o schema.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'docker', 'postgres', 'init', '01-schema.sql');
const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js', { paths: [root] });

const HEADER = `-- ============================================================================
-- ARQUIVO GERADO — NÃO EDITAR À MÃO.
-- Fonte: prisma/schema.prisma. Para regenerar: npm run db:schema
-- O CI (job db-schema) falha se este arquivo não bater com o schema.prisma.
-- ============================================================================

`;

const sql = execFileSync(
  process.execPath,
  [
    prismaCli,
    'migrate',
    'diff',
    '--from-empty',
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--script',
  ],
  { cwd: root, encoding: 'utf8' },
);

// Normaliza para LF: o mesmo arquivo é gerado no Windows e conferido no Linux.
const content = (HEADER + sql).replace(/\r\n/g, '\n');

if (process.argv.includes('--check')) {
  const current = existsSync(target)
    ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n')
    : '';
  if (current !== content) {
    console.error(
      '✖ docker/postgres/init/01-schema.sql está desatualizado em relação ao prisma/schema.prisma.\n' +
        '  Rode `npm run db:schema` e faça commit do arquivo gerado.',
    );
    process.exit(1);
  }
  console.log('✔ 01-schema.sql em dia com o prisma/schema.prisma.');
} else {
  writeFileSync(target, content);
  console.log('✔ docker/postgres/init/01-schema.sql gerado.');
}
