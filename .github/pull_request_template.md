## Descrição da mudança

<!-- O que foi feito e por quê. Se resolve uma issue, referencie com "Closes #123". -->

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `docs` — documentação
- [ ] `refactor` — refatoração sem mudança de comportamento
- [ ] `test` — adição/ajuste de testes
- [ ] `chore` — manutenção, build, dependências, CI
- [ ] `perf` — melhoria de performance
- [ ] `style` — formatação, sem mudança de lógica

## Como testar

<!-- Passo a passo para reproduzir/validar localmente. Inclua comandos, se relevante. -->

1.
2.
3.

## Checklist (Definition of Done)

- [ ] `npm run lint:check` passa sem erros
- [ ] `npm run build` passa sem erros
- [ ] `npm run test:cov` passa e mantém a cobertura mínima dos módulos exigidos (events/tags/contributors/gallery)
- [ ] `npm run test:e2e` passa
- [ ] Nenhum segredo, credencial ou `.env` real foi commitado
- [ ] Mensagens de commit seguem Conventional Commits
- [ ] Esta PR tem como base a branch `development` (ou é um `hotfix/*` indo direto para `production`)
- [ ] Documentação/comentários relevantes foram atualizados, se necessário
