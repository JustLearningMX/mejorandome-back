import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Nutrition (e2e)', () => {
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

  describe('POST /api/nutrition/meals', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .send({
          mealType: 'lunch',
          description: 'Pechuga de pollo con arroz',
          hungerBefore: 7,
          satietyAfter: 8,
        })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 401 when invalid bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({
          mealType: 'lunch',
          description: 'Pechuga de pollo con arroz',
          hungerBefore: 7,
          satietyAfter: 8,
        })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización inválido o expirado',
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'mealType es requerido',
          'description no puede estar vacío',
          'hungerBefore es requerido',
          'satietyAfter es requerido',
        ]),
      );
    });

    it('should return 400 when mealType is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mealType: 'invalid-type',
          description: 'Comida',
          hungerBefore: 5,
          satietyAfter: 6,
        })
        .expect(400);

      expect(response.body.message[0]).toContain(
        'mealType debe ser uno de los siguientes valores',
      );
    });

    it('should return 400 when hungerBefore is outside allowed range (1-10)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mealType: 'lunch',
          description: 'Comida rica',
          hungerBefore: 15,
          satietyAfter: 8,
        })
        .expect(400);

      expect(response.body.message).toContain(
        'hungerBefore debe ser un número entero entre 1 y 10',
      );
    });

    it('should return 400 when non-whitelisted properties are sent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/nutrition/meals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          mealType: 'lunch',
          description: 'Comida',
          hungerBefore: 5,
          satietyAfter: 5,
          extraUnknownField: 'injected',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'property extraUnknownField should not exist',
      );
    });
  });

  describe('GET /api/nutrition/meals', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nutrition/meals')
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 400 when limit is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nutrition/meals?limit=150')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toContain(
        'limit debe ser menor o igual a 100',
      );
    });

    it('should return 400 when localDate format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/nutrition/meals?localDate=27-10-2026')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toContain(
        'localDate debe tener el formato YYYY-MM-DD',
      );
    });
  });

  describe('DELETE /api/nutrition/meals/:id', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .delete('/api/nutrition/meals/11111111-1111-1111-1111-111111111111')
        .expect(401);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/api/nutrition/meals/not-a-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });
  });
});
