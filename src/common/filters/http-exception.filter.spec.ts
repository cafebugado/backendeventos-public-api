import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(request: { method: string; url: string }): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
} {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('HttpExceptionFilter', () => {
  it('formata HttpException com o status e a mensagem originais', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost({
      method: 'GET',
      url: '/events/published',
    });

    filter.catch(new BadRequestException('limit inválido'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const [body]: [Record<string, unknown>] = response.json.mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.path).toBe('/events/published');
    expect(body.message).toMatchObject({ message: 'limit inválido' });
  });

  it('trata exceções não-HTTP como 500 sem vazar detalhes internos', () => {
    const filter = new HttpExceptionFilter();
    const { host, response } = createHost({
      method: 'GET',
      url: '/events/published',
    });

    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });
});
