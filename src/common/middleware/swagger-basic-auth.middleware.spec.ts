import type { Request, Response } from 'express';
import { createSwaggerBasicAuthMiddleware } from './swagger-basic-auth.middleware';

function buildAuthHeader(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

function createResponseMock(): Response {
  return {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('createSwaggerBasicAuthMiddleware', () => {
  const middleware = createSwaggerBasicAuthMiddleware('admin', 'super-secreta');

  it('chama next() quando usuário e senha estão corretos', () => {
    const req = {
      headers: { authorization: buildAuthHeader('admin', 'super-secreta') },
    } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 401 quando não há header Authorization', () => {
    const req = { headers: {} } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).toHaveBeenCalledWith(401);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      expect.stringContaining('Basic'),
    );
  });

  it('retorna 401 quando a senha está errada', () => {
    const req = {
      headers: { authorization: buildAuthHeader('admin', 'senha-errada') },
    } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 401 quando o usuário está errado', () => {
    const req = {
      headers: {
        authorization: buildAuthHeader('outro-user', 'super-secreta'),
      },
    } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 401 quando o header não é do tipo Basic', () => {
    const req = {
      headers: { authorization: 'Bearer algum-token' },
    } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna 401 quando o base64 decodificado não tem separador ":"', () => {
    const req = {
      headers: {
        authorization: `Basic ${Buffer.from('sem-separador').toString('base64')}`,
      },
    } as unknown as Request;
    const res = createResponseMock();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- mock local, não é método de classe real
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
