import { Logger } from '@nestjs/common';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  // Espera o Observable terminar (lastValueFrom) em vez do callback `done`, que
  // o Vitest não suporta. Com `done`, a verificação rodaria depois do teste ser
  // dado como aprovado.
  it('loga método, rota e duração após a resposta', async () => {
    const interceptor = new LoggingInterceptor();
    const logSpy = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/events/published' }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = { handle: () => of([{ id: '1' }]) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\[.+] GET \/events\/published \+\d+ms$/),
    );
    logSpy.mockRestore();
  });
});
