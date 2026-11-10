#!/usr/bin/env node
// Chamado quando `npm run db:up`/`db:reset` falha: explica o próximo passo.
console.error(`
✖ O banco local não ficou pronto.

  1. Veja o erro:          npm run db:logs
     (procure por "ERROR" — normalmente aponta a linha do .sql que falhou)
  2. Corrija o .sql indicado (em geral o 04-seed.sql, depois de uma mudança
     no prisma/schema.prisma).
  3. Recrie do zero:       npm run db:reset

  Os scripts de docker/postgres/init só rodam com o volume VAZIO. Se um init
  falhou, o volume fica pela metade e só o db:reset resolve.
  Docker parado? Abra o Docker Desktop e tente de novo.
`);
process.exit(1);
