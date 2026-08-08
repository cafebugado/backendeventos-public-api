import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const CACHE_CONTROL_VALUE = 'public, max-age=30, stale-while-revalidate=120';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        response.setHeader('Cache-Control', CACHE_CONTROL_VALUE);
      }),
    );
  }
}
