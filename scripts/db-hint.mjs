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

  Porta 5433 ocupada ("port is already allocated")? Use outra porta: coloque
  DB_PORT=5440 no .env e troque 5433 por 5440 no DATABASE_URL e no DIRECT_URL.

  Banco sobe, mas a API cai com P1000 ("Authentication failed ...
  public_api_readonly")? Provavelmente um PostgreSQL instalado na máquina
  escuta na 5433 e responde no lugar do container. Mesma solução da porta
  acima. Detalhes em CONTRIBUTING.md, "Porta 5433 ocupada por outro Postgres".

  API cai com P1001 ("Can't reach database server at localhost")? Use
  127.0.0.1 no lugar de localhost no DATABASE_URL e no DIRECT_URL.
`);
process.exit(1);
