#!/usr/bin/env node
// Gera as notas de release exatamente como o job `release` do CI faz
// (@semantic-release/release-notes-generator + .releaserc.json) e falha se:
//   - a geração quebrar (ex.: preset incompatível com o gerador instalado);
//   - faltar alguma seção configurada, ou aparecer uma seção que deveria ficar oculta.
//
//   npm run check:release-notes
//
// Por que existe: o job `release` só roda em push para development/production,
// nunca em PR. Uma atualização das ferramentas de release (ex.: o
// conventional-changelog-conventionalcommits 10, que exige um gerador de notas
// mais novo que o do semantic-release 25) passaria com o CI verde e só quebraria
// na próxima release. Esta checagem roda em toda PR.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));

const releaserc = JSON.parse(readFileSync(join(root, '.releaserc.json'), 'utf8'));
const notesPlugin = releaserc.plugins.find(
  (p) => Array.isArray(p) && p[0] === '@semantic-release/release-notes-generator',
);
if (!notesPlugin) {
  console.error('✖ .releaserc.json não configura o @semantic-release/release-notes-generator.');
  process.exit(1);
}
const options = notesPlugin[1];

// Um commit de cada tipo configurado, mais um breaking change.
const types = options.presetConfig.types;
const commits = [
  ...types.map((t, i) => ({
    hash: String(i).padStart(40, '0'),
    message: `${t.type}(teste): commit de exemplo do tipo ${t.type}`,
  })),
  {
    hash: 'f'.repeat(40),
    message: 'feat!: mudança incompatível de exemplo\n\nBREAKING CHANGE: campo removido',
  },
];

const { generateNotes } = await import(
  pathToFileURL(require.resolve('@semantic-release/release-notes-generator')).href
);

let notes;
try {
  notes = await generateNotes(options, {
    cwd: root,
    commits,
    lastRelease: { gitTag: 'v0.0.0', version: '0.0.0' },
    nextRelease: { gitTag: 'v1.0.0', version: '1.0.0' },
    options: { repositoryUrl: 'https://github.com/cafebugado/backendeventos-public-api.git' },
    logger: { log() {}, error() {} },
  });
} catch (error) {
  console.error('✖ A geração das notas de release QUEBROU. O job `release` falharia.\n');
  console.error(`  ${error.message}\n`);
  console.error(
    '  Provável causa: atualização de @semantic-release/* ou do\n' +
      '  conventional-changelog-conventionalcommits incompatível entre si.',
  );
  process.exit(1);
}

const problems = [];
for (const t of types) {
  if (!t.section) continue;
  const present = notes.includes(`### ${t.section}`);
  if (t.hidden && present) problems.push(`seção oculta apareceu: "${t.section}"`);
  if (!t.hidden && !present) problems.push(`seção esperada não apareceu: "${t.section}"`);
}
if (!/BREAKING CHANGES/.test(notes)) problems.push('seção de BREAKING CHANGES não apareceu');

if (problems.length > 0) {
  console.error('✖ Notas de release geradas, mas diferentes do configurado:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`\n--- notas geradas ---\n${notes}`);
  process.exit(1);
}

const visible = types.filter((t) => t.section && !t.hidden).length;
console.log(`✔ Notas de release geradas corretamente (${visible} seções + BREAKING CHANGES).`);
