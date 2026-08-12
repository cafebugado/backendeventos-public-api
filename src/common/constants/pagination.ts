/**
 * Teto de segurança aplicado em endpoints de listagem que hoje não expõem
 * paginação própria (ou a expõem mas aceitam omitir `limit`), para evitar
 * que um `findMany` sem `take` retorne a tabela inteira.
 */
export const SAFE_LIST_LIMIT = 100;
