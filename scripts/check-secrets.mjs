#!/usr/bin/env node
// Barra credenciais antes que cheguem ao repositório (que é PÚBLICO).
//
//   node scripts/check-secrets.mjs        → confere os arquivos em stage (pre-commit)
//   node scripts/check-secrets.mjs --all  → confere todos os arquivos versionados (CI)
//
// Regras:
//   1. Nenhum arquivo .env* pode ser versionado, exceto o .env.example.
//   2. Nenhuma URL de conexão do Supabase pode ter uma senha de verdade.
//      Placeholders (veja PLACEHOLDERS) são permitidos, para a documentação.
//
// Falso positivo? Troque a senha do exemplo por um dos placeholders abaixo.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const ALL = process.argv.includes('--all');

const PLACEHOLDERS = new Set([
  'senha',
  'SENHA',
  'password',
  '[YOUR-PASSWORD]',
  'DEFINA-UMA-SENHA-FORTE',
]);

// postgres(ql)://usuario:senha@host-do-supabase
const SUPABASE_URL =
  /postgres(?:ql)?:\/\/[^:/\s"'`@]+:([^@\s"'`]+)@[^\s"'`/]*supabase\.(?:co|com)/g;

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const files = (
  ALL
    ? git('ls-files', '-z')
    : git('diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR')
)
  .split('\0')
  .filter(Boolean);

const readContent = (file) => {
  try {
    // No pre-commit, lê a versão EM STAGE (a que vai para o commit), não a do disco.
    return ALL ? readFileSync(file, 'utf8') : git('show', `:${file}`);
  } catch {
    return '';
  }
};

const problems = [];

for (const file of files) {
  const name = basename(file);
  if (name.startsWith('.env') && name !== '.env.example') {
    problems.push(`${file}: arquivo de ambiente não pode ser versionado`);
    continue;
  }

  const content = readContent(file);
  if (content.includes('\0')) continue; // binário

  content.split('\n').forEach((line, i) => {
    for (const match of line.matchAll(SUPABASE_URL)) {
      if (!PLACEHOLDERS.has(match[1])) {
        problems.push(
          `${file}:${i + 1}: URL do Supabase com senha (use um placeholder, ex.: "senha")`,
        );
      }
    }
  });
}

if (problems.length > 0) {
  console.error('✖ Possível credencial no commit:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\n  O repositório é público. Remova a credencial' +
      (ALL ? '.' : ' do stage (git restore --staged <arquivo>).') +
      '\n  Credenciais de produção ficam só na Vercel e no gerenciador de senhas.',
  );
  process.exit(1);
}

console.log(
  `✔ Nenhuma credencial encontrada (${files.length} arquivo(s) conferido(s)).`,
);
