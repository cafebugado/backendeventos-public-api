# Integração GitHub → Discord

Notificações da equipe **Eventos API Pública** no Discord do Café Bugado.
Só observa eventos: não roda código de PR, não altera o repositório e nunca bloqueia merge
(se o Discord falhar, o job termina com um aviso, não com erro).

## O que vai para cada canal

| Canal | Conteúdo |
|---|---|
| `#api-tarefas` (fórum) | Um post por **issue**. Tags seguem as labels (P0–P3, tipo), 🚧 quando há responsável, ✅ e arquivado ao fechar. Comentários da issue entram no post. |
| `#api-prs` (fórum) | Um post por **PR**: review pedido (menciona o reviewer), aprovado / mudanças pedidas (menciona o autor), CI, preview da Vercel, merge. Arquivado ao fechar. |
| `#api-github` | Commits em `development` e `production`, releases: 🧪 pré-release de `development` (amarela, sem menção) e 🏷️ release estável de `production` (roxa, menciona @Lead). |
| `#api-deploys` | Deploys da Vercel (produção, desenvolvimento e previews). |
| `#api-alertas` | CI/CodeQL quebrado em `development`/`production` (@Lead @Dev), deploy de produção falhou e produção fora do ar (@Lead @Dev), desenvolvimento fora do ar (só texto). |
| `#api-geral` | Resumo semanal (segunda, 09:00). |

## Arquivos

- `workflows/discord-notify.yml`: eventos de issues, PRs, reviews, CI (`workflow_run`), deploys (`deployment_status`), push e release.
- `workflows/discord-health.yml`: verifica `/health` a cada 5 min e avisa só quando o estado muda.
- `workflows/discord-weekly.yml`: resumo semanal.
- `discord/notify.mjs`: lógica de cada evento. `discord/lib.mjs`: funções puras, testadas em `lib.test.mjs`.

## Configuração do repositório

| Nome | Tipo | Conteúdo |
|---|---|---|
| `DISCORD_CONFIG` | Variable (e Dependabot secret) | JSON com IDs do servidor, fóruns/tags, cargos, URLs de health e o mapa `login do GitHub → ID do Discord` |
| `DISCORD_WEBHOOKS` | Secret (Actions e Dependabot) | JSON com as URLs dos webhooks de cada canal |
| `DISCORD_BOT_TOKEN` | Secret (Actions e Dependabot) | Token do bot **Café Bugado · GitHub**, sem permissões no servidor, só na categoria da equipe (para mudar tags e arquivar posts) |

Os segredos também ficam como **Dependabot secrets**, porque os eventos disparados pelo Dependabot não leem os segredos do Actions.

### Adicionar alguém ao mapa de menções

Edite a variável `DISCORD_CONFIG` → `users`:

```json
"users": { "darioreisjr": "847859710514298892", "novo-login": "ID_DO_DISCORD" }
```

Quem não estiver no mapa aparece só com o login, sem menção.

## Testar

```bash
node --test .github/discord/lib.test.mjs
```

Os workflows podem ser disparados manualmente em **Actions → Discord · Health / Resumo semanal → Run workflow**.

> Os eventos `issues`, `pull_request_target`, `workflow_run`, `deployment_status`, `release` e `schedule`
> usam o workflow da branch padrão (`production`): a integração só fica completa depois do merge em `production`.
