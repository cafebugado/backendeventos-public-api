export interface CacheTtlOptions {
  /** Segundos em que a resposta é considerada fresca (navegador e CDN). */
  maxAge: number;
  /**
   * Segundos, depois de `maxAge`, em que a CDN ainda entrega a cópia antiga
   * enquanto busca a nova em segundo plano.
   */
  staleWhileRevalidate: number;
}

/**
 * Janelas de cache por tipo de dado, declaradas nas rotas via `@CacheTtl`.
 * Cada resposta que expira e é pedida de novo executa a função e vai ao
 * banco, então dado que muda pouco usa janela maior (ver issue #35).
 */
export const CACHE_TTL = {
  /** Rotas cacheáveis que não declaram `@CacheTtl`. */
  default: { maxAge: 30, staleWhileRevalidate: 120 },
  /** Listagens, detalhe e recomendações de eventos. */
  events: { maxAge: 60, staleWhileRevalidate: 300 },
  /** Tags, contribuidores, estatísticas e galeria: mudam poucas vezes por dia. */
  reference: { maxAge: 300, staleWhileRevalidate: 3600 },
} as const satisfies Record<string, CacheTtlOptions>;
