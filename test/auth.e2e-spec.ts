import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/auth/google', () => {
    it('should return 400 when idToken is missing or empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/google')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when idToken is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/google')
        .send({ idToken: 'invalid-fake-google-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Token de Google inválido o expirado');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 401 when invalid bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización inválido o expirado',
      );
    });
  });
});
