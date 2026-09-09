import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Transactions (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-${Date.now()}@atlas.dev`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SifreGuclu123', fullName: 'E2E Test' });
    accessToken = registerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates income and expense transactions and computes summary correctly', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'INCOME', amount: 10000, category: 'Maaş', date: '2026-09-01T00:00:00.000Z' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'EXPENSE', amount: 2500, category: 'Fatura', date: '2026-09-05T00:00:00.000Z' })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(listRes.body.data).toHaveLength(2);

    const summaryRes = await request(app.getHttpServer())
      .get('/transactions/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(summaryRes.body.data).toEqual({
      totalIncome: 10000,
      totalExpense: 2500,
      availableBalance: 7500,
    });
  });

  it('rejects access without a valid token', async () => {
    await request(app.getHttpServer()).get('/transactions').expect(401);
  });

  it('prevents users from accessing another user\'s transaction', async () => {
    const otherEmail = `e2e-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const created = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'INCOME', amount: 100, category: 'Test', date: '2026-09-01T00:00:00.000Z' });

    await request(app.getHttpServer())
      .get(`/transactions/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
