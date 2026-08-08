import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { CacheControlInterceptor } from './cache-control.interceptor';

describe('CacheControlInterceptor', () => {
  it('define o header Cache-Control esperado na resposta', (done) => {
    const interceptor = new CacheControlInterceptor();
    const setHeader = jest.fn();

    const context = {
      switchToHttp: () => ({
        getResponse: () => ({ setHeader }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = { handle: () => of([{ id: '1' }]) };

    interceptor.intercept(context, next).subscribe(() => {
      expect(setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=30, stale-while-revalidate=120',
      );
      done();
    });
  });
});
