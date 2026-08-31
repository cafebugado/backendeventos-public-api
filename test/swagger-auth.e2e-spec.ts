import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-app.helper';

describe('Proteção do Swagger (/docs, /docs-json)', () => {
  describe('sem SWAGGER_USER/SWAGGER_PASSWORD configuradas', () => {
    let app: INestApplication;
    let server: Server;

    beforeAll(async () => {
      delete process.env.SWAGGER_USER;
      delete process.env.SWAGGER_PASSWORD;
      ({ app, server } = await createTestApp());
    });

    afterAll(async () => {
      await app.close();
    });

    it('permite acessar /docs-json sem autenticação', async () => {
      const response = await request(server).get('/docs-json');

      expect(response.status).toBe(200);
    });
  });

  describe('com SWAGGER_USER/SWAGGER_PASSWORD configuradas', () => {
    let app: INestApplication;
    let server: Server;
    const originalUser = process.env.SWAGGER_USER;
    const originalPassword = process.env.SWAGGER_PASSWORD;

    beforeAll(async () => {
      process.env.SWAGGER_USER = 'admin';
      process.env.SWAGGER_PASSWORD = 'senha-de-teste';
      ({ app, server } = await createTestApp());
    });

    afterAll(async () => {
      await app.close();
      if (originalUser === undefined) {
        delete process.env.SWAGGER_USER;
      } else {
        process.env.SWAGGER_USER = originalUser;
      }
      if (originalPassword === undefined) {
        delete process.env.SWAGGER_PASSWORD;
      } else {
        process.env.SWAGGER_PASSWORD = originalPassword;
      }
    });

    it('bloqueia /docs sem credenciais (401)', async () => {
      const response = await request(server).get('/docs');

      expect(response.status).toBe(401);
    });

    it('bloqueia /docs-json com credenciais erradas (401)', async () => {
      const response = await request(server)
        .get('/docs-json')
        .auth('admin', 'senha-errada');

      expect(response.status).toBe(401);
    });

    it('libera /docs-json com as credenciais corretas (200)', async () => {
      const response = await request(server)
        .get('/docs-json')
        .auth('admin', 'senha-de-teste');

      expect(response.status).toBe(200);
    });
  });
});
