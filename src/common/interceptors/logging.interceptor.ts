import { randomUUID } from 'node:crypto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = randomUUID();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        this.logger.log(
          `[${requestId}] ${method} ${originalUrl} +${durationMs}ms`,
        );
      }),
    );
  }
}
