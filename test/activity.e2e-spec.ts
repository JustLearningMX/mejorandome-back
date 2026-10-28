import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Activity (e2e)', () => {
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

  describe('POST /api/activity/steps', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .send({ steps: 8500 })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización no proporcionado',
      );
    });

    it('should return 401 when invalid bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ steps: 8500 })
        .expect(401);

      expect(response.body).toHaveProperty(
        'message',
        'Token de autorización inválido o expirado',
      );
    });

    it('should return 400 when steps is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['steps es requerido']),
      );
    });

    it('should return 400 when steps is negative or exceeds maximum', async () => {
      const responseNegative = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ steps: -5 })
        .expect(400);

      expect(responseNegative.body.message).toEqual(
        expect.arrayContaining(['steps debe ser mayor o igual a 0']),
      );

      const responseExceeds = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ steps: 200000 })
        .expect(400);

      expect(responseExceeds.body.message).toEqual(
        expect.arrayContaining(['steps no puede ser mayor a 150,000']),
      );
    });

    it('should return 400 when localDate format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ steps: 5000, localDate: '28-10-2026' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['localDate debe tener formato YYYY-MM-DD válido']),
      );
    });

    it('should return 400 when non-whitelisted properties are sent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/steps')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ steps: 5000, extraProperty: 'not-allowed' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['property extraProperty should not exist']),
      );
    });
  });

  describe('GET /api/activity/steps', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/activity/steps')
        .expect(401);
    });

    it('should return 400 when query parameter limit is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/activity/steps?limit=0')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['limit debe ser mayor o igual a 1']),
      );
    });

    it('should return 400 when startDate or endDate format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/activity/steps?startDate=invalid-date')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['startDate debe tener el formato YYYY-MM-DD']),
      );
    });
  });

  describe('POST /api/activity/exercises', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/activity/exercises')
        .send({
          exerciseType: 'walking',
          durationMinutes: 30,
        })
        .expect(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/exercises')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'exerciseType es requerido',
          'durationMinutes es requerido',
        ]),
      );
    });

    it('should return 400 when exerciseType is not in catalog', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/exercises')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          exerciseType: 'skydiving',
          durationMinutes: 30,
        })
        .expect(400);

      expect(response.body.message[0]).toContain(
        'exerciseType debe ser uno de los siguientes valores',
      );
    });

    it('should return 400 when intensity is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/exercises')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          exerciseType: 'walking',
          durationMinutes: 30,
          intensity: 'super-hard',
        })
        .expect(400);

      expect(response.body.message[0]).toContain(
        'intensity debe ser uno de los siguientes valores',
      );
    });

    it('should return 400 when durationMinutes is outside allowed range (1-720)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/activity/exercises')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          exerciseType: 'walking',
          durationMinutes: 0,
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'durationMinutes debe ser entre 1 y 720 minutos',
        ]),
      );
    });
  });

  describe('GET /api/activity/exercises', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/activity/exercises')
        .expect(401);
    });

    it('should return 400 when limit is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/activity/exercises?limit=200')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['limit debe ser menor o igual a 100']),
      );
    });

    it('should return 400 when localDate format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/activity/exercises?localDate=2026/10/28')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['localDate debe tener el formato YYYY-MM-DD']),
      );
    });
  });

  describe('DELETE /api/activity/exercises/:id', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .delete('/api/activity/exercises/f47ac10b-58cc-4372-a567-0e02b2c3d479')
        .expect(401);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/api/activity/exercises/not-a-valid-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });
  });

  describe('GET /api/activity/summary', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/api/activity/summary')
        .expect(401);
    });
  });

  describe('PATCH /api/activity/goals', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch('/api/activity/goals')
        .send({ stepsGoal: 8000 })
        .expect(401);
    });

    it('should return 400 when stepsGoal is missing', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/activity/goals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['stepsGoal es requerido']),
      );
    });

    it('should return 400 when stepsGoal is less than 1,000 or greater than 50,000', async () => {
      const responseLow = await request(app.getHttpServer())
        .patch('/api/activity/goals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ stepsGoal: 500 })
        .expect(400);

      expect(responseLow.body.message).toEqual(
        expect.arrayContaining(['stepsGoal debe ser al menos 1,000 pasos']),
      );

      const responseHigh = await request(app.getHttpServer())
        .patch('/api/activity/goals')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ stepsGoal: 60000 })
        .expect(400);

      expect(responseHigh.body.message).toEqual(
        expect.arrayContaining(['stepsGoal no puede exceder 50,000 pasos']),
      );
    });
  });
});

