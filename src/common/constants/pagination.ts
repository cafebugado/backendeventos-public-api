/**
 * Teto de segurança aplicado em endpoints de listagem que hoje não expõem
 * paginação própria (ou a expõem mas aceitam omitir `limit`), para evitar
 * que um `findMany` sem `take` retorne a tabela inteira.
 */
export const SAFE_LIST_LIMIT = 100;

/**
 * Teto de `GET /events/upcoming`. Maior que o das demais listagens porque o
 * frontend precisa de todos os eventos futuros de uma vez para filtrar e
 * paginar no client (ver issue #34).
 */
export const UPCOMING_LIST_LIMIT = 500;

/**
 * Teto de candidatos lidos para montar as recomendações de um evento. Os
 * candidatos vêm ordenados por data, então, se o teto for atingido, ficam de
 * fora os eventos mais distantes no tempo (ver issue #32).
 */
export const RECOMMENDATION_CANDIDATES_LIMIT = 1000;
