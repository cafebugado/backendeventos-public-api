# backendeventos-public-api

API pública, **somente-leitura**, dos eventos do Café Bugado. Implementada em Node.js/NestJS,
consumida exclusivamente pelo frontend `E:\agendas_eventos`.

Este projeto é **independente** de `D:\backendeventos` (a API Python/FastAPI que concentra
CRUD, autenticação e RBAC). Os dois projetos leem do **mesmo Postgres do Supabase**, mas com
credenciais diferentes: `D:\backendeventos` usa uma credencial privilegiada (bypass RLS),
enquanto este projeto usa uma **role dedicada somente-leitura** (`public_api_readonly`) —
nunca escreve no banco, nem por engano. Isso é garantido em duas camadas independentes:

1. **Código**: nenhuma camada (repository, service, controller) implementa `create`/`update`/
   `delete`/`insert`. Auditável com uma busca simples no repositório.
2. **Banco**: a role `public_api_readonly` só tem `GRANT SELECT`. Um `INSERT`/`UPDATE` manual
   com essa role falha com erro de permissão do Postgres — a prova real de isolamento não
   depende de o código estar correto.

## Stack

- NestJS 11 (TypeScript, strict mode)
- Prisma **6.x** + `@prisma/client` (ver nota de versão abaixo)
- Postgres do Supabase (pooler transacional em runtime, conexão direta só para tooling)
- class-validator / class-transformer, Swagger (`@nestjs/swagger`), `@nestjs/throttler`
- Jest + Supertest (unitários, e2e e teste de contrato)

### Nota sobre a versão do Prisma

O Prisma 7 (a major mais recente na época deste sprint) removeu o suporte a `url`/`directUrl`
diretamente no `datasource` do `schema.prisma` — a conexão passa a ser configurada via um
`prisma.config.ts` novo, e o `PrismaClient` passou a exigir um "driver adapter" explícito no
código (`@prisma/adapter-pg`). Isso é uma mudança arquitetural grande e ainda pouco
documentada/testada em produção. Para manter o padrão clássico (`url`/`directUrl` inline no
schema, como o pooler+conexão direta do Supabase recomenda) com o mínimo de risco, este
projeto está fixado em `prisma@6.19.3` (`--save-exact`, sem `^`), a última série estável antes
dessa mudança. Reavaliar a migração para Prisma 7 só quando o driver-adapter model estiver
mais maduro/documentado.

## Arquitetura

```
Controller (NestJS) -> Service (regra de negócio) -> Repository (interface + implementação Prisma) -> PrismaClient
                                    |
                                DTO (class-validator / @ApiProperty)
```

- `src/config`: carregamento e validação de variáveis de ambiente (`class-validator`).
- `src/prisma`: `PrismaService`/`PrismaModule` (módulo global, conecta/desconecta com o
  ciclo de vida da aplicação).
- `src/common`: filtro global de exceções, interceptors (`Cache-Control`, logging de
  requisições) e pipes reservados para sprints futuras.
- `src/modules/health`: `GET /health`, executa `SELECT 1` via Prisma.
- `src/modules/events`: feature `GET /events/published` — repository por trás de uma
  interface (`IEventoRepository`, token de injeção via `Symbol`) para permitir troca/mock
  sem tocar no service; DTO de resposta mapeado campo-a-campo (nunca expõe `status`,
  `created_by` ou `motivo_recusa`, campos internos de moderação do FastAPI).

## Configuração

Copie `.env.example` para `.env` e preencha:

- `PORT`: porta local (default `3000`).
- `CORS_ORIGINS`: origens do frontend liberadas no CORS, separadas por vírgula.
- `DATABASE_URL`: pooler transacional do Supabase (porta `6543`, `pgbouncer=true&connection_limit=1`)
  — usada pela aplicação em runtime.
- `DIRECT_URL`: conexão direta ao Postgres (porta `5432`) — usada **só** por
  `npx prisma db pull` / `migrate`, nunca pela aplicação.

**Antes de preencher `DATABASE_URL`/`DIRECT_URL`**, crie a role dedicada somente-leitura no
SQL Editor do seu projeto Supabase rodando [`prisma/setup-readonly-role.sql`](prisma/setup-readonly-role.sql)
(troque a senha placeholder antes de rodar). O arquivo já inclui uma query de verificação
(confirma que a role não é superusuário/bypass-RLS) e um `INSERT` comentado para você provar
manualmente, se quiser, que a role realmente não escreve.

Use as credenciais dessa role (nunca a role privilegiada do `D:\backendeventos`) nas duas
connection strings.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL e CORS_ORIGINS
npx prisma generate
npm run start:dev
```

A API sobe em `http://localhost:3000`. Swagger em `http://localhost:3000/docs`.

## Testes

```bash
npm run test       # unitários (mockam Prisma — não dependem de rede/credenciais)
npm run test:e2e   # e2e + teste de contrato (Prisma mockado via overrideProvider)
npm run test:cov   # cobertura, com gate de 80% para modules/events
npm run lint
```

Todos os testes (unitários e e2e) usam um `PrismaService` mockado (`jest-mock-extended`) —
rodam completos sem exigir conexão real ao Supabase.

## Endpoints implementados

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica a aplicação e a conexão com o banco (`SELECT 1`). |
| `GET` | `/events/published` | Eventos com `status = 'publicado'`, ordenados por `created_at DESC`. Aceita `?limit=1-100`, `?offset=>=0`, `?cidade=` e `?modalidade=` (ambos case-insensitive), todos opcionais e combináveis. DTO completo (16 campos de apresentação + metadados). |
| `GET` | `/events/featured` | Os últimos eventos cadastrados (`status = 'publicado'`, ordenados por `created_at DESC`). Aceita `?limit=1-10`, default `3`. DTO **enxuto** — só `id, slug, nome, descricao, data_evento, horario, imagem, created_at`, os únicos campos que o card de destaque da home (`E:\agendas_eventos`) lê. Feito pra ser o mais rápido possível: usa `select` do Prisma pra não trazer colunas que não vão ser usadas. |

Veja `SPRINT.md` para o roadmap completo (sprints 2–6: tags, upcoming, detalhe por slug,
estatísticas, contribuidores, galeria, recomendados).

## Independência de `D:\backendeventos`

Este repositório não importa nenhum arquivo, pacote ou configuração de
`D:\backendeventos`. A única coisa compartilhada é o banco de dados Postgres do Supabase
(schema `public`), acessado com uma role diferente e exclusivamente para leitura.
