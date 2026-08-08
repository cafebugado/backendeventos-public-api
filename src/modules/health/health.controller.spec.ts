import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  function createController(
    queryRawImpl: () => Promise<unknown>,
  ): HealthController {
    const prisma = {
      $queryRaw: jest.fn(queryRawImpl),
    } as unknown as PrismaService;
    return new HealthController(prisma);
  }

  it('retorna status ok quando o SELECT 1 é bem-sucedido', async () => {
    const controller = createController(() =>
      Promise.resolve([{ '?column?': 1 }]),
    );

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('lança ServiceUnavailableException quando o banco falha', async () => {
    const controller = createController(() =>
      Promise.reject(new Error('connection refused')),
    );

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
