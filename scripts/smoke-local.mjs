#!/usr/bin/env node
// Smoke test contra a API rodando com o banco LOCAL (docker compose + seed).
//
//   npm run db:up && npm run start:dev   (em outro terminal)
//   npm run test:smoke                   (BASE_URL=http://localhost:3000 por padrão)
//
// Complementa os testes do Vitest (que mockam o Prisma): aqui as queries rodam
// num Postgres de verdade — inclusive o SQL cru de /events/upcoming — e as
// regras de moderação são conferidas contra os casos do 04-seed.sql.
// As contagens abaixo dependem do seed: mudou o seed, ajuste aqui.

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const HIDDEN = [
  'rascunho-nao-deve-aparecer',
  'recusado-nao-deve-aparecer',
  'em-analise-nao-deve-aparecer',
];
const REACT_ID = '11111111-1111-4111-8111-000000000001';
const RASCUNHO_ID = '11111111-1111-4111-8111-000000000005';

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? '✔' : '✖'} ${msg}`);
  if (!cond) failures++;
};
const get = async (path) => {
  const res = await fetch(BASE + path);
  return { status: res.status, body: await res.json().catch(() => null) };
};
const list = (body) => (Array.isArray(body) ? body : (body?.data ?? []));

const health = await get('/health').catch(() => null);
if (health?.status !== 200) {
  console.error(
    `✖ API não respondeu em ${BASE}/health. Ela está rodando com o banco local?`,
  );
  process.exit(1);
}

const published = list((await get('/events/published?limit=100')).body);
check(published.length === 17, `published: 17 eventos (veio ${published.length})`);
check(
  !published.some((e) => HIDDEN.includes(e.slug)),
  'published não mostra rascunho/recusado/em_analise',
);
check(
  !published.some((e) => 'status' in e || 'motivo_recusa' in e || 'created_by' in e),
  'published não expõe status/motivo_recusa/created_by',
);
check(
  list((await get('/events/published?limit=5&offset=5')).body).length === 5,
  'paginação ?limit=5&offset=5',
);
check(
  list((await get('/events/published?cidade=s%C3%A3o%20paulo&limit=100')).body)
    .length === 1,
  'filtro ?cidade= sem diferenciar maiúsculas',
);

const upcoming = list((await get('/events/upcoming?limit=100')).body);
check(upcoming.length === 15, `upcoming: 15 eventos futuros (veio ${upcoming.length})`);
check(
  !upcoming.some((e) =>
    ['hackathon-passado-exemplo', 'evento-data-a-definir-exemplo'].includes(e.slug),
  ),
  'upcoming ignora evento passado e data "A definir"',
);
check(upcoming[0]?.slug === 'meetup-react-exemplo', 'upcoming começa pelo mais próximo');

check(list((await get('/events/featured')).body).length === 3, 'featured: 3 por padrão');
check((await get('/events/slug/meetup-react-exemplo')).status === 200, 'detalhe por slug');
check((await get(`/events/slug/${REACT_ID}`)).status === 200, 'detalhe por id');
check(
  (await get('/events/slug/rascunho-nao-deve-aparecer')).status === 404,
  'rascunho por slug responde 404',
);
check(
  (await get('/events/slug/meetup-react-exemplo/detail')).status === 200,
  'detail',
);
check((await get('/events/stats/public')).status === 200, 'stats/public');
check(list((await get(`/events/${REACT_ID}/tags`)).body).length === 2, 'tags do evento');
check(
  list((await get(`/events/${REACT_ID}/recommended`)).body).length > 0,
  'recommended devolve eventos',
);
check(list((await get('/tags')).body).length === 6, 'tags: 6');
check(
  !JSON.stringify((await get('/events/tags-map')).body).includes(RASCUNHO_ID),
  'tags-map não inclui evento rascunho',
);
check(list((await get('/contributors')).body).length === 3, 'contributors: 3');

const gallery = await get('/gallery/albums/public');
check(list(gallery.body).length === 3, 'galeria: 3 álbuns');
check(
  !JSON.stringify(gallery.body).includes('Rascunho (não deve aparecer)'),
  'galeria não mostra nome de evento rascunho',
);
check((await get('/docs-json')).status === 200, 'Swagger /docs-json');

console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTudo certo.');
process.exit(failures ? 1 : 0);
