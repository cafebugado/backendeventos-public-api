# Contribuindo com o backendeventos-public-api

## Fluxo de branches

Este repositório usa duas branches de longa duração:

- **`production`** — reflete o que está (ou vai) para produção. Protegida:
  só recebe Pull Requests vindos de `development` ou de branches `hotfix/*`
  (para correções urgentes). Push direto é bloqueado.
- **`development`** — branch de integração. Todo o trabalho do dia a dia
  acontece aqui. Push direto também é bloqueado; toda mudança entra via PR.

Branches de feature/correção **nascem sempre a partir de `development`**
(nunca de `production`, exceto hotfix) e são apagadas depois do merge.

Convenção de nomes:

| Prefixo     | Uso                                                 |
|-------------|------------------------------------------------------|
| `feat/`     | nova funcionalidade                                   |
| `fix/`      | correção de bug                                       |
| `chore/`    | manutenção, build, dependências, configuração         |
| `docs/`     | documentação                                          |
| `refactor/` | refatoração sem mudança de comportamento              |
| `test/`     | testes                                                |
| `hotfix/`   | correção urgente indo direto para `production`        |

Exemplo de fluxo:

```bash
git checkout development
git pull origin development
git checkout -b feat/endpoint-busca-por-tag
# ... commits ...
git push -u origin feat/endpoint-busca-por-tag
# abrir PR: feat/endpoint-busca-por-tag -> development
```

## Conventional Commits

As mensagens de commit seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/),
validado automaticamente pelo commitlint (hook `commit-msg` do Husky) antes
mesmo do push. Formato:

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

Exemplos em português:

```
feat: adiciona endpoint de listagem de eventos por tag
fix: corrige serialização de data_evento no controller de eventos
docs: atualiza README com instruções de setup local
chore: atualiza dependências de desenvolvimento
refactor: extrai validação de slug para um pipe reutilizável
test: cobre cenário de contribuidor duplicado no service
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

**O título do PR importa:** PRs entram em `development` por squash, então o
título do PR vira a mensagem do commit (e define a próxima versão, veja
abaixo). O check `pr-title` (`.github/workflows/pr-title.yml`) bloqueia títulos
fora do padrão, como `atualiza coisas` ou `fix: Corrige algo` (a descrição não
pode começar com maiúscula).

## Versionamento e releases

As releases são geradas automaticamente pelo [semantic-release](https://semantic-release.gitbook.io/)
(job `release` do CI, configuração em `.releaserc.json`), sempre **depois**
que `lint`, `build`, `unit-tests` e `e2e-tests` passam num push:

| Branch        | Release                                   | Exemplo         |
|---------------|-------------------------------------------|-----------------|
| `development` | **pré-release** (marcada como pre-release) | `v0.2.0-dev.1`  |
| `production`  | **release estável** (marcada como latest)  | `v0.2.0`        |

A versão é calculada pelos commits desde a última release:

| Commits                                                   | Próxima versão                  |
|-----------------------------------------------------------|---------------------------------|
| só `fix:` / `perf:`                                       | patch: `0.2.0` → `0.2.1`        |
| algum `feat:`                                             | minor: `0.2.1` → `0.3.0`        |
| `feat!:` ou rodapé `BREAKING CHANGE:`                     | minor enquanto estivermos em `0.x`: `0.3.0` → `0.4.0` |
| só `chore` / `docs` / `test` / `ci` / `style` / `refactor` / `build` | **nenhuma release**   |

> Enquanto a API não estabilizar, breaking change **não** leva a `1.0.0`. Ir
> para `1.0.0` é uma decisão do time: remover a regra
> `{ "breaking": true, "release": "minor" }` do `.releaserc.json`.

As notas de cada release (em português, agrupadas por tipo, com link para cada
PR) ficam em **Releases** no GitHub e são postadas no `#api-github` do
Discord. Nada é commitado nas branches: não existe `CHANGELOG.md` e a versão
do `package.json` não é atualizada.

### Sincronizar `production` → `development` depois de cada release

A tag da release estável fica no merge commit de `production`, que não existe
em `development`. Por isso, depois de cada release estável o job `release`
abre automaticamente o PR **`chore: sincroniza production em development (vX.Y.Z)`**.

- Faça o merge desse PR com **Create a merge commit** (nunca squash).
- Sem ele, as pré-releases continuam calculando a versão a partir da release
  anterior (ex.: `v0.1.0-dev.4` sendo publicada depois da `v0.2.0`).
- O mesmo vale para hotfix: o PR também é aberto depois da release do hotfix.

### Desfazer uma release

```bash
gh release delete vX.Y.Z --cleanup-tag
```

## Ambiente local com Docker

Para rodar a API com dados, **ninguém precisa de credencial do Supabase**. O
`docker compose` sobe um Postgres na sua máquina com o mesmo schema da
produção, dados fictícios e a mesma role somente leitura
(`public_api_readonly`). O banco de produção nunca é tocado.

Pré-requisitos: Node 22 (`.nvmrc`) e Docker Desktop (ou Docker Engine) rodando.

```bash
git clone https://github.com/cafebugado/backendeventos-public-api.git
cd backendeventos-public-api
cp .env.example .env     # já vem apontando para o banco local, não precisa editar
npm install
npm run db:up            # sobe o Postgres em localhost:5433 com schema + seed
npm run start:dev        # API em http://localhost:3000, Swagger em /docs
```

Para conferir se está tudo certo, com a API rodando, em outro terminal:

```bash
npm run test:smoke       # ~22 verificações contra a API + banco local
```

### Comandos do banco local

| Comando | O que faz |
|---|---|
| `npm run db:up` | Sobe o banco (cria e popula na primeira vez). |
| `npm run db:down` | Para o banco, mantendo os dados. |
| `npm run db:reset` | Apaga tudo e recria do zero (schema + seed). |
| `npm run db:logs` | Mostra os logs do Postgres (erros de init aparecem aqui). |
| `npm run db:psql` | Abre um `psql` como superusuário dentro do container. |
| `npm run db:schema` | Regenera `docker/postgres/init/01-schema.sql` a partir do `schema.prisma`. |

### Como o banco local é montado

Os arquivos de `docker/postgres/init/` rodam em ordem, **só quando o volume
está vazio** (primeiro `db:up` ou depois de um `db:reset`):

| Arquivo | Conteúdo | Quem mantém |
|---|---|---|
| `01-schema.sql` | Tabelas, índices e FKs | **Gerado** do `prisma/schema.prisma` (`npm run db:schema`). Não edite à mão. |
| `02-constraints.sql` | Defaults de `id` e CHECK constraints que o Prisma não descreve | À mão |
| `03-readonly-role.sql` | Role `public_api_readonly` (senha local `readonly_local`) | À mão |
| `04-seed.sql` | Dados fictícios. Datas relativas ao dia de criação do banco | À mão |

O seed cobre de propósito os casos das regras da API: eventos `rascunho`,
`recusado` e `em_analise` (que nunca podem aparecer), um evento passado, um
com data "A definir", álbum de galeria ligado a rascunho etc. **Nunca coloque
dados reais da produção no seed**, porque o repositório é público.

### Quando mudar o `schema.prisma`

Na mesma PR:

1. `npm run db:schema` para regenerar o `01-schema.sql` (o job `db-schema` do CI
   falha se você esquecer).
2. Coluna nova `NOT NULL` sem default? Inclua-a nos `INSERT` do `04-seed.sql`.
   Senão o banco não sobe (o job `smoke-local` do CI também pega isso).
3. CHECK constraint ou default novo no banco real? Atualize o `02-constraints.sql`.
4. `npm run db:reset && npm run start:dev` e depois `npm run test:smoke`. Se mudou a
   quantidade de registros do seed, ajuste as contagens em
   `scripts/smoke-local.mjs`.

Depois de um `git pull` que mexeu em `docker/postgres/init/`, rode
`npm run db:reset`. O volume antigo não é atualizado sozinho.

### Problemas comuns

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| `db:up` termina com "O banco local não ficou pronto" | Um `.sql` do init falhou | `npm run db:logs`, procure `ERROR` (mostra arquivo e linha), corrija e rode `npm run db:reset` |
| `db:up` falha logo depois de um init que deu erro | Volume ficou pela metade e o init não roda de novo | `npm run db:reset` |
| `error during connect` / `dockerDesktopLinuxEngine` | Docker Desktop fechado | Abra o Docker Desktop e espere ficar "running" |
| `port is already allocated` na 5433 | Outra coisa usando a porta | `DB_PORT=5440 npm run db:up` e troque a porta no `.env` |
| `column "x" does not exist` na API | Banco criado antes de uma mudança de schema | `npm run db:reset` |
| `/events/upcoming` vazio | Banco criado há muito tempo e as datas do seed já passaram | `npm run db:reset` |
| `permission denied for table ...` | Algo tentou escrever no banco: a role é somente leitura **de propósito** | Esta API não escreve. Reveja o código |

## Rodando localmente antes de abrir a PR

```bash
npm ci
npx prisma generate
npm run lint          # com --fix, corrige o que der automaticamente
npm run build
npm run test:cov      # unitários + cobertura (mínimo 80% em events/tags/contributors/gallery)
npm run test:e2e
npm run db:schema:check   # só se mexeu no schema.prisma
```

Os testes unitários e e2e usam o Prisma totalmente mockado, então não
precisam de banco nenhum. O `npm run test:smoke` (seção acima) é o único que
roda contra um Postgres de verdade.

## O que o CI valida

Em todo PR e push para `development`/`production`, o workflow `CI`
(`.github/workflows/ci.yml`) roda em paralelo:

- **`lint`** — ESLint sem `--fix` (falha se houver algo para corrigir)
- **`build`** — `prisma generate` + `nest build`
- **`unit-tests`** — testes unitários com cobertura mínima obrigatória
- **`e2e-tests`** — testes end-to-end
- **`db-schema`** — confere se `docker/postgres/init/01-schema.sql` está em
  dia com o `prisma/schema.prisma`
- **`smoke-local`** — sobe o Postgres local (schema + seed), inicia a API e
  roda `npm run test:smoke` contra ela
- **`release`** — só em push para `development`/`production`, depois dos
  seis acima: gera a release (veja "Versionamento e releases")

Em PRs com destino `production`, o workflow `Verify PR Source Branch`
(`.github/workflows/verify-pr-source.yml`) também roda e bloqueia o merge
se o PR não vier de `development` ou de uma branch `hotfix/*`.

Um workflow separado (`CodeQL`) roda análise estática de segurança em todo
push/PR para `production`/`development` e semanalmente — não bloqueia PRs,
mas gera alertas na aba **Security** do repositório.
