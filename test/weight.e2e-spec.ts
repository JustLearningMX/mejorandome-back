import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Weight (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let validToken: string;

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

    jwtService = app.get(JwtService);
    validToken = await jwtService.signAsync({
      sub: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/weight', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/weight')
        .send({ weightKg: 80.5 })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 401 when invalid bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/weight')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ weightKg: 80.5 })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización inválido o expirado',
      );
    });

    it('should return 400 when weightKg is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when weightKg is out of allowed range (< 20 or > 350)', async () => {
      const responseBelow = await request(app.getHttpServer())
        .post('/api/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ weightKg: 10 })
        .expect(400);

      expect(responseBelow.body.message).toContain('weightKg debe ser mayor o igual a 20');

      const responseAbove = await request(app.getHttpServer())
        .post('/api/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ weightKg: 500 })
        .expect(400);

      expect(responseAbove.body.message).toContain('weightKg debe ser menor o igual a 350');
    });

    it('should return 400 when occurredAt is not a valid ISO 8601 string', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/weight')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ weightKg: 80.5, occurredAt: 'invalid-date-format' })
        .expect(400);

      expect(response.body.message).toContain('occurredAt debe ser una fecha ISO 8601 válida');
    });
  });

  describe('GET /api/weight', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/weight')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 400 when query parameter limit is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/weight?limit=0')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toContain('limit debe ser mayor a 0');
    });
  });
});
