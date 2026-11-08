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

## Rodando localmente antes de abrir a PR

```bash
npm ci
npx prisma generate
npm run lint          # com --fix, corrige o que der automaticamente
npm run build
npm run test:cov      # unitários + cobertura (mínimo 80% em events/tags/contributors/gallery)
npm run test:e2e
```

Os testes (unitários e e2e) usam o Prisma totalmente mockado — não é
necessário ter um banco de dados real nem credenciais do Supabase para
rodá-los localmente.

## O que o CI valida

Em todo PR e push para `development`/`production`, o workflow `CI`
(`.github/workflows/ci.yml`) roda em paralelo:

- **`lint`** — ESLint sem `--fix` (falha se houver algo para corrigir)
- **`build`** — `prisma generate` + `nest build`
- **`unit-tests`** — testes unitários com cobertura mínima obrigatória
- **`e2e-tests`** — testes end-to-end
- **`release`** — só em push para `development`/`production`, depois dos
  quatro acima: gera a release (veja "Versionamento e releases")

Em PRs com destino `production`, o workflow `Verify PR Source Branch`
(`.github/workflows/verify-pr-source.yml`) também roda e bloqueia o merge
se o PR não vier de `development` ou de uma branch `hotfix/*`.

Um workflow separado (`CodeQL`) roda análise estática de segurança em todo
push/PR para `production`/`development` e semanalmente — não bloqueia PRs,
mas gera alertas na aba **Security** do repositório.
