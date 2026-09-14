import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Accounts (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-accounts-${Date.now()}@atlas.dev`;

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

  it('creates a BANK account', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'BANK', name: 'Vadesiz Hesap', bankName: 'Ziraat', balance: 5000 })
      .expect(201);
    expect(res.body.data.type).toBe('BANK');
    expect(res.body.data.balance).toBe('5000');
  });

  it('creates a CREDIT_CARD account and computes availableLimit', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'CREDIT_CARD', name: 'Bonus Kart', bankName: 'Garanti', cardLimit: 10000, currentDebt: 3000 })
      .expect(201);
    expect(res.body.data.availableLimit).toBe('7000');
  });

  it('rejects CREDIT_CARD without cardLimit', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'CREDIT_CARD', name: 'Eksik Kart' })
      .expect(400);
  });

  it('creates a LOAN account defaulting remainingDebt to loanAmount', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'LOAN', name: 'İhtiyaç Kredisi', loanAmount: 20000, monthlyInstallment: 1000 })
      .expect(201);
    expect(res.body.data.remainingDebt).toBe('20000');
  });

  it('rejects LOAN with remainingDebt greater than loanAmount', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'LOAN', name: 'Gecersiz Kredi', loanAmount: 1000, remainingDebt: 5000 })
      .expect(400);
  });

  it('creates an OVERDRAFT account and derives remainingOverdraftLimit', async () => {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'OVERDRAFT', name: 'KMH', overdraftLimit: 5000, usedAmount: 1500 })
      .expect(201);
    expect(res.body.data.remainingOverdraftLimit).toBe(3500);
  });

  it('lists only the current user accounts', async () => {
    const res = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data.every((a: { userId: string }) => a.userId)).toBe(true);
  });

  it('updates own account', async () => {
    const created = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'BANK', name: 'Guncellenecek Hesap', balance: 100 });

    const updated = await request(app.getHttpServer())
      .patch(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ balance: 250 })
      .expect(200);
    expect(updated.body.data.balance).toBe('250');
  });

  it('deletes own account', async () => {
    const created = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'BANK', name: 'Silinecek Hesap', balance: 10 });

    await request(app.getHttpServer())
      .delete(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('forbids access to another user\'s account', async () => {
    const otherEmail = `e2e-accounts-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const created = await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'BANK', name: 'Ozel Hesap', balance: 1 });

    await request(app.getHttpServer())
      .get(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ balance: 999 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('computes account summary correctly', async () => {
    const summaryEmail = `e2e-accounts-summary-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: summaryEmail, password: 'SifreGuclu123' });
    const token = registerRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'BANK', name: 'Hesap 1', balance: 1000 });
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'CREDIT_CARD', name: 'Kart 1', cardLimit: 5000, currentDebt: 2000 });
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'LOAN', name: 'Kredi 1', loanAmount: 10000, monthlyInstallment: 500, remainingDebt: 8000 });
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'OVERDRAFT', name: 'KMH 1', overdraftLimit: 3000, usedAmount: 1000 });

    const summary = await request(app.getHttpServer())
      .get('/accounts/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(summary.body.data).toEqual({
      totalBankBalance: 1000,
      totalCreditCardDebt: 2000,
      totalCreditCardLimit: 5000,
      totalAvailableCardLimit: 3000,
      totalLoanRemainingDebt: 8000,
      totalMonthlyLoanInstallments: 500,
      totalOverdraftLimit: 3000,
      totalOverdraftUsed: 1000,
    });
  });
});
