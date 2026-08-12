import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestApp {
  app: INestApplication;
  server: Server;
  prisma: DeepMockProxy<PrismaService>;
}

/**
 * Sobe uma instância completa do AppModule com o PrismaService trocado por
 * um mock profundo (jest-mock-extended) — mesmo setup repetido em todo
 * *.e2e-spec.ts e contract.spec.ts antes desta extração.
 */
export async function createTestApp(): Promise<TestApp> {
  const prisma = mockDeep<PrismaService>();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  const server = app.getHttpServer() as Server;

  return { app, server, prisma };
}
