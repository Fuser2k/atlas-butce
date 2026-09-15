import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Planning & Briefing (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const email = `e2e-planning-${Date.now()}@atlas.dev`;
  const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

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

  it('returns an empty briefing for a user with no data (no scary/fabricated content)', async () => {
    const res = await request(app.getHttpServer())
      .get('/briefing/daily')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.data.headline).toBeTruthy();
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('builds a monthly payment plan combining bills and account due dates without double counting', async () => {
    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Internet', category: 'İnternet', amount: 200, dueDate: daysFromNow(5) });
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'LOAN', name: 'Plan Kredisi', loanAmount: 5000, monthlyInstallment: 250, dueDate: daysFromNow(10) });

    const plan = await request(app.getHttpServer())
      .get('/planning/monthly')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(plan.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(plan.body.data.totalAmount).toBeGreaterThanOrEqual(450);
    const types = plan.body.data.items.map((i: { type: string }) => i.type);
    expect(types).toContain('BILL');
    expect(types).toContain('LOAN');
  });

  it('surfaces overdue bills as a WARNING priority item in the briefing', async () => {
    const overdueEmail = `e2e-planning-overdue-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: overdueEmail, password: 'SifreGuclu123' });
    const token = registerRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gecikmiş Aidat', category: 'Aidat', amount: 400, dueDate: daysAgo(3) });

    const briefing = await request(app.getHttpServer())
      .get('/briefing/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const warningItem = briefing.body.data.items.find(
      (i: { type: string; priority: string }) => i.type === 'PAYMENT' && i.priority === 'WARNING',
    );
    expect(warningItem).toBeTruthy();
  });

  it('includes the highest expense category and a savings goal item when data exists', async () => {
    const dataEmail = `e2e-planning-data-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: dataEmail, password: 'SifreGuclu123' });
    const token = registerRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'EXPENSE', amount: 2000, category: 'Kira', date: new Date().toISOString() });
    await request(app.getHttpServer())
      .post('/savings')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tatil Fonu', targetAmount: 1000, currentAmount: 250 });

    const briefing = await request(app.getHttpServer())
      .get('/briefing/daily')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const budgetItem = briefing.body.data.items.find((i: { type: string; text: string }) =>
      i.type === 'BUDGET' && i.text.includes('Kira'),
    );
    const savingsItem = briefing.body.data.items.find((i: { type: string }) => i.type === 'SAVINGS');
    expect(budgetItem).toBeTruthy();
    expect(savingsItem).toBeTruthy();
    expect(savingsItem.text).toContain('Tatil Fonu');
  });

  it('data isolation: one user briefing/plan never reflects another user\'s data', async () => {
    const aEmail = `e2e-planning-a-${Date.now()}@atlas.dev`;
    const bEmail = `e2e-planning-b-${Date.now()}@atlas.dev`;
    const aRes = await request(app.getHttpServer()).post('/auth/register').send({ email: aEmail, password: 'SifreGuclu123' });
    const bRes = await request(app.getHttpServer()).post('/auth/register').send({ email: bEmail, password: 'SifreGuclu123' });
    const aToken = aRes.body.data.accessToken;
    const bToken = bRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${aToken}`)
      .send({ name: 'A Kullanıcısı Faturası', category: 'Diğer', amount: 999, dueDate: daysFromNow(2) });

    const bPlan = await request(app.getHttpServer())
      .get('/planning/monthly')
      .set('Authorization', `Bearer ${bToken}`)
      .expect(200);
    expect(bPlan.body.data.items.some((i: { title: string }) => i.title === 'A Kullanıcısı Faturası')).toBe(false);
  });
});
