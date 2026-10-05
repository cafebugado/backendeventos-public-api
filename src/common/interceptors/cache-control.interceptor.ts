import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_TTL } from '../constants/cache-ttl';
import type { CacheTtlOptions } from '../constants/cache-ttl';
import { CacheTtl } from '../decorators/cache-ttl.decorator';

export function buildCacheControl(ttl: CacheTtlOptions): string {
  return `public, max-age=${ttl.maxAge}, stale-while-revalidate=${ttl.staleWhileRevalidate}`;
}

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();
    const ttl =
      this.reflector.getAllAndOverride(CacheTtl, [
        context.getHandler(),
        context.getClass(),
      ]) ?? CACHE_TTL.default;
    const cacheControl = buildCacheControl(ttl);

    return next.handle().pipe(
      tap(() => {
        response.setHeader('Cache-Control', cacheControl);
      }),
    );
  }
}
