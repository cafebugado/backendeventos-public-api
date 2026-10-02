import { Reflector } from '@nestjs/core';
import type { CacheTtlOptions } from '../constants/cache-ttl';

/**
 * Declara a janela de cache de um controller ou de uma rota, lida pelo
 * `CacheControlInterceptor`. No método, sobrepõe o valor do controller.
 */
export const CacheTtl = Reflector.createDecorator<CacheTtlOptions>();
