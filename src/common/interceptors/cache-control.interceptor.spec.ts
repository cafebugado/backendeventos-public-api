import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { CACHE_TTL } from '../constants/cache-ttl';
import { CacheTtl } from '../decorators/cache-ttl.decorator';
import {
  buildCacheControl,
  CacheControlInterceptor,
} from './cache-control.interceptor';

class SemDeclaracaoController {
  rota(): void {}
}

@CacheTtl(CACHE_TTL.events)
class ComDeclaracaoController {
  herdaDoController(): void {}

  @CacheTtl(CACHE_TTL.reference)
  sobrepoeNoMetodo(): void {}
}

type AnyController = new () => object;

function buildContext(
  controller: AnyController,
  handlerName: string,
  setHeader: jest.Mock,
): ExecutionContext {
  const prototype = controller.prototype as Record<string, () => void>;
  return {
    getClass: () => controller,
    getHandler: () => prototype[handlerName],
    switchToHttp: () => ({
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ExecutionContext;
}

describe('CacheControlInterceptor', () => {
  const interceptor = new CacheControlInterceptor(new Reflector());
  const next: CallHandler = { handle: () => of([{ id: '1' }]) };

  it('usa a janela padrão quando a rota não declara @CacheTtl', async () => {
    const setHeader = jest.fn();
    const context = buildContext(SemDeclaracaoController, 'rota', setHeader);

    await firstValueFrom(interceptor.intercept(context, next));

    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=30, stale-while-revalidate=120',
    );
  });

  it('usa a janela declarada no controller', async () => {
    const setHeader = jest.fn();
    const context = buildContext(
      ComDeclaracaoController,
      'herdaDoController',
      setHeader,
    );

    await firstValueFrom(interceptor.intercept(context, next));

    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=60, stale-while-revalidate=300',
    );
  });

  it('a janela declarada no método sobrepõe a do controller', async () => {
    const setHeader = jest.fn();
    const context = buildContext(
      ComDeclaracaoController,
      'sobrepoeNoMetodo',
      setHeader,
    );

    await firstValueFrom(interceptor.intercept(context, next));

    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=3600',
    );
  });

  it('não define o header quando o handler falha', async () => {
    const setHeader = jest.fn();
    const context = buildContext(SemDeclaracaoController, 'rota', setHeader);
    const failing: CallHandler = {
      handle: () => throwError(() => new Error('falhou')),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, failing)),
    ).rejects.toThrow('falhou');
    expect(setHeader).not.toHaveBeenCalled();
  });
});

describe('buildCacheControl', () => {
  it('monta o header a partir da janela informada', () => {
    expect(buildCacheControl({ maxAge: 10, staleWhileRevalidate: 20 })).toBe(
      'public, max-age=10, stale-while-revalidate=20',
    );
  });
});
