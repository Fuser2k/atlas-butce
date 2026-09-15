import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Savings (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-savings-${Date.now()}@atlas.dev`;
  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

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

  it('creates a goal without target date -> NO_TARGET_DATE', async () => {
    const res = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Acil Durum Fonu', targetAmount: 10000 })
      .expect(201);
    expect(res.body.data.currentAmount).toBe(0);
    expect(res.body.data.remainingAmount).toBe(10000);
    expect(res.body.data.progressPercentage).toBe(0);
    expect(res.body.data.paceStatus).toBe('NO_TARGET_DATE');
  });

  it('rejects non-positive targetAmount', async () => {
    await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Geçersiz Hedef', targetAmount: 0 })
      .expect(400);
  });

  it('rejects invalid targetDate', async () => {
    await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Geçersiz Tarih', targetAmount: 1000, targetDate: 'not-a-date' })
      .expect(400);
  });

  it('computes remainingAmount, progressPercentage and BEHIND pace for a past-due unmet goal', async () => {
    const res = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Geciken Hedef', targetAmount: 1000, currentAmount: 200, targetDate: inDays(-5) })
      .expect(201);
    expect(res.body.data.remainingAmount).toBe(800);
    expect(res.body.data.progressPercentage).toBe(20);
    expect(res.body.data.remainingDays).toBe(0);
    expect(res.body.data.paceStatus).toBe('BEHIND');
  });

  it('computes ON_TRACK pace when monthlyPlanAmount covers the required monthly saving', async () => {
    const res = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Planli Hedef',
        targetAmount: 6000,
        currentAmount: 0,
        targetDate: inDays(180),
        monthlyPlanAmount: 2000,
      })
      .expect(201);
    expect(res.body.data.paceStatus).toBe('ON_TRACK');
  });

  it('computes BEHIND pace when monthlyPlanAmount is insufficient', async () => {
    const res = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Yetersiz Plan',
        targetAmount: 6000,
        currentAmount: 0,
        targetDate: inDays(30),
        monthlyPlanAmount: 100,
      })
      .expect(201);
    expect(res.body.data.paceStatus).toBe('BEHIND');
  });

  it('marks a fully funded goal as AHEAD', async () => {
    const res = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Tamamlanan Hedef', targetAmount: 500, currentAmount: 500, targetDate: inDays(30) })
      .expect(201);
    expect(res.body.data.remainingAmount).toBe(0);
    expect(res.body.data.paceStatus).toBe('AHEAD');
  });

  it('updates goal fields', async () => {
    const created = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Güncellenecek', targetAmount: 1000 });

    const updated = await request(app.getHttpServer())
      .patch(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Güncellendi', targetAmount: 2000 })
      .expect(200);
    expect(updated.body.data.name).toBe('Güncellendi');
    expect(updated.body.data.targetAmount).toBe(2000);
  });

  it('adds to current amount via progress endpoint', async () => {
    const created = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'İlerleme Testi', targetAmount: 1000, currentAmount: 100 });

    const progressed = await request(app.getHttpServer())
      .patch(`/savings/${created.body.data.id}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: 250 })
      .expect(200);
    expect(progressed.body.data.currentAmount).toBe(350);
  });

  it('does not let progress go below zero', async () => {
    const created = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Azaltma Testi', targetAmount: 1000, currentAmount: 100 });

    const progressed = await request(app.getHttpServer())
      .patch(`/savings/${created.body.data.id}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ delta: -500 })
      .expect(200);
    expect(progressed.body.data.currentAmount).toBe(0);
  });

  it('deletes own goal', async () => {
    const created = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Silinecek', targetAmount: 100 });

    await request(app.getHttpServer())
      .delete(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('forbids access to another user\'s goal', async () => {
    const otherEmail = `e2e-savings-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const created = await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Özel Hedef', targetAmount: 100 });

    await request(app.getHttpServer())
      .get(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Ele Geçirme' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/savings/${created.body.data.id}/progress`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ delta: 10 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/savings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
