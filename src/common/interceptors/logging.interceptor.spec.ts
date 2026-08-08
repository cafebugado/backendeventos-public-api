import { Logger } from '@nestjs/common';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('loga método, rota e duração após a resposta', (done) => {
    const interceptor = new LoggingInterceptor();
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/events/published' }),
      }),
    } as unknown as ExecutionContext;

    const next: CallHandler = { handle: () => of([{ id: '1' }]) };

    interceptor.intercept(context, next).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[.+] GET \/events\/published \+\d+ms$/),
      );
      logSpy.mockRestore();
      done();
    });
  });
});
