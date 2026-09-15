import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Household (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-household-${Date.now()}@atlas.dev`;

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

  it('creates a household member', async () => {
    const res = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Eş' })
      .expect(201);
    expect(res.body.data.name).toBe('Eş');
  });

  it('lists own household members', async () => {
    const res = await request(app.getHttpServer())
      .get('/household')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('updates own member', async () => {
    const created = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Çocuk' });

    const updated = await request(app.getHttpServer())
      .patch(`/household/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Çocuk (Güncellendi)' })
      .expect(200);
    expect(updated.body.data.name).toBe('Çocuk (Güncellendi)');
  });

  it('deletes own member and sets related transactions householdMemberId to null', async () => {
    const created = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Silinecek Üye' });
    const memberId = created.body.data.id;

    const tx = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'EXPENSE', amount: 50, category: 'Market', date: new Date().toISOString(), householdMemberId: memberId })
      .expect(201);
    expect(tx.body.data.householdMemberId).toBe(memberId);

    await request(app.getHttpServer())
      .delete(`/household/${memberId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const txAfter = await request(app.getHttpServer())
      .get(`/transactions/${tx.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(txAfter.body.data.householdMemberId).toBeNull();
  });

  it('forbids access to another user\'s household member', async () => {
    const otherEmail = `e2e-household-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const created = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Özel Üye' });

    await request(app.getHttpServer())
      .get(`/household/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/household/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Ele Geçirme' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/household/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('rejects assigning a transaction to another user\'s household member', async () => {
    const otherEmail = `e2e-household-other2-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const otherMember = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Başkasının Üyesi' });

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'EXPENSE',
        amount: 10,
        category: 'Test',
        date: new Date().toISOString(),
        householdMemberId: otherMember.body.data.id,
      })
      .expect(403);
  });

  it('computes household summary correctly', async () => {
    const summaryEmail = `e2e-household-summary-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: summaryEmail, password: 'SifreGuclu123' });
    const token = registerRes.body.data.accessToken;

    const member1 = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Üye 1' });
    const member2 = await request(app.getHttpServer())
      .post('/household')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Üye 2' });

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INCOME',
        amount: 10000,
        category: 'Maaş',
        date: new Date().toISOString(),
        householdMemberId: member1.body.data.id,
      });
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 3000,
        category: 'Market',
        date: new Date().toISOString(),
        householdMemberId: member1.body.data.id,
      });
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 1000,
        category: 'Eğlence',
        date: new Date().toISOString(),
        householdMemberId: member2.body.data.id,
      });

    const summary = await request(app.getHttpServer())
      .get('/household/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(summary.body.data.totalIncome).toBe(10000);
    expect(summary.body.data.totalExpense).toBe(4000);
    expect(summary.body.data.net).toBe(6000);
    const m1 = summary.body.data.members.find((m: { id: string }) => m.id === member1.body.data.id);
    const m2 = summary.body.data.members.find((m: { id: string }) => m.id === member2.body.data.id);
    expect(m1).toEqual({ id: member1.body.data.id, name: 'Üye 1', income: 10000, expense: 3000, net: 7000 });
    expect(m2).toEqual({ id: member2.body.data.id, name: 'Üye 2', income: 0, expense: 1000, net: -1000 });
  });
});
