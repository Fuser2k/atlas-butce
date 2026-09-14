import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Bills (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-bills-${Date.now()}@atlas.dev`;

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
      .send({ email, password: 'SifreGuclu123' });
    accessToken = registerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  it('creates a one-off bill', async () => {
    const res = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Elektrik', category: 'Fatura', amount: 350, dueDate: inDays(10) })
      .expect(201);
    expect(res.body.data.recurrencePeriod).toBe('NONE');
    expect(res.body.data.isPaid).toBe(false);
  });

  it('creates a recurring bill', async () => {
    const res = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Kira', category: 'Kira', amount: 15000, dueDate: inDays(5), recurrencePeriod: 'MONTHLY' })
      .expect(201);
    expect(res.body.data.recurrencePeriod).toBe('MONTHLY');
  });

  it('rejects invalid amount and recurrence', async () => {
    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Gecersiz', category: 'Fatura', amount: -5, dueDate: inDays(1) })
      .expect(400);

    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Gecersiz2', category: 'Fatura', amount: 10, dueDate: inDays(1), recurrencePeriod: 'DAILY' })
      .expect(400);
  });

  it('lists bills', async () => {
    const res = await request(app.getHttpServer())
      .get('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('returns bills due within the next 30 days by default', async () => {
    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Uzak Fatura', category: 'Fatura', amount: 100, dueDate: inDays(60) });

    const res = await request(app.getHttpServer())
      .get('/bills/upcoming')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.every((b: { name: string }) => b.name !== 'Uzak Fatura')).toBe(true);
    expect(res.body.data.some((b: { name: string }) => b.name === 'Elektrik')).toBe(true);
  });

  it('marking a recurring bill as paid rolls the due date forward instead of leaving it paid', async () => {
    const created = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Netflix', category: 'Abonelik', amount: 200, dueDate: inDays(2), recurrencePeriod: 'MONTHLY' });

    const originalDueDate = new Date(created.body.data.dueDate);

    const updated = await request(app.getHttpServer())
      .patch(`/bills/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isPaid: true })
      .expect(200);

    expect(updated.body.data.isPaid).toBe(false);
    const newDueDate = new Date(updated.body.data.dueDate);
    const expected = new Date(originalDueDate);
    expected.setUTCMonth(expected.getUTCMonth() + 1);
    expect(newDueDate.getTime()).toBe(expected.getTime());
  });

  it('marking a one-off bill as paid keeps it paid', async () => {
    const created = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Tek Seferlik', category: 'Diger', amount: 50, dueDate: inDays(3) });

    const updated = await request(app.getHttpServer())
      .patch(`/bills/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isPaid: true })
      .expect(200);

    expect(updated.body.data.isPaid).toBe(true);
  });

  it('updates and deletes own bill', async () => {
    const created = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Guncellenecek', category: 'Fatura', amount: 75, dueDate: inDays(4) });

    const updated = await request(app.getHttpServer())
      .patch(`/bills/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 90 })
      .expect(200);
    expect(updated.body.data.amount).toBe('90');

    await request(app.getHttpServer())
      .delete(`/bills/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/bills/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('forbids access to another user\'s bill', async () => {
    const otherEmail = `e2e-bills-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const created = await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Ozel Fatura', category: 'Fatura', amount: 10, dueDate: inDays(1) });

    await request(app.getHttpServer())
      .get(`/bills/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/bills/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ isPaid: true })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/bills/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
