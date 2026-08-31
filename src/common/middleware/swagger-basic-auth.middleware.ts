import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  // Tamanhos diferentes não podem ir pro timingSafeEqual (ele exige buffers
  // do mesmo tamanho) — aceitável vazar o tamanho aqui, o que importa é não
  // vazar em qual posição a comparação de conteúdo divergiu.
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * HTTP Basic Auth simples para proteger /docs e /docs-json em produção.
 * Sem dependência externa (express-basic-auth) — a spec de Basic Auth é
 * pequena o suficiente pra não justificar mais uma dependência só pra isso.
 */
export function createSwaggerBasicAuthMiddleware(
  expectedUser: string,
  expectedPassword: string,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(
        header.slice('Basic '.length),
        'base64',
      ).toString('utf-8');
      const separatorIndex = decoded.indexOf(':');

      if (separatorIndex !== -1) {
        const providedUser = decoded.slice(0, separatorIndex);
        const providedPassword = decoded.slice(separatorIndex + 1);

        if (
          safeCompare(providedUser, expectedUser) &&
          safeCompare(providedPassword, expectedPassword)
        ) {
          next();
          return;
        }
      }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger", charset="UTF-8"');
    res
      .status(401)
      .send('Autenticação necessária para acessar a documentação.');
  };
}
