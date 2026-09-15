import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';
import { NotificationsService } from './../src/modules/notifications/notifications.service.js';

describe('Notifications / Payment Reminders (e2e)', () => {
  let app: INestApplication<App>;
  let notificationsService: NotificationsService;
  let accessToken: string;
  let userId: string;

  const email = `e2e-notifications-${Date.now()}@atlas.dev`;
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    notificationsService = app.get(NotificationsService);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SifreGuclu123' });
    accessToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a reminder for a bill due today', async () => {
    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Elektrik Faturası', category: 'Elektrik', amount: 300, dueDate: new Date().toISOString() });

    const result = await notificationsService.generateDueReminders(userId);
    expect(result.generated).toBeGreaterThan(0);

    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.some((r: { sourceType: string }) => r.sourceType === 'BILL')).toBe(true);
  });

  it('generates a reminder for a credit card due date', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'CREDIT_CARD',
        name: 'Reminder Kartı',
        cardLimit: 5000,
        minPaymentAmount: 200,
        dueDate: new Date().toISOString(),
      });

    await notificationsService.generateDueReminders(userId);
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.some((r: { sourceType: string }) => r.sourceType === 'CREDIT_CARD')).toBe(true);
  });

  it('generates a reminder for a loan due date', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'LOAN',
        name: 'Reminder Kredisi',
        loanAmount: 10000,
        monthlyInstallment: 500,
        dueDate: new Date().toISOString(),
      });

    await notificationsService.generateDueReminders(userId);
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.some((r: { sourceType: string }) => r.sourceType === 'LOAN')).toBe(true);
  });

  it('generates a reminder for an overdraft due date', async () => {
    await request(app.getHttpServer())
      .post('/accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'OVERDRAFT',
        name: 'Reminder KMH',
        overdraftLimit: 3000,
        usedAmount: 1000,
        dueDate: new Date().toISOString(),
      });

    await notificationsService.generateDueReminders(userId);
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.data.some((r: { sourceType: string }) => r.sourceType === 'OVERDRAFT')).toBe(true);
  });

  it('does not create duplicate reminders on repeated runs', async () => {
    const before = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const countBefore = before.body.data.length;

    const result = await notificationsService.generateDueReminders(userId);
    expect(result.generated).toBe(0);

    const after = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(after.body.data.length).toBe(countBefore);
  });

  it('does not generate a reminder for a due date far in the future', async () => {
    const farEmail = `e2e-notifications-far-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: farEmail, password: 'SifreGuclu123' });
    const farUserId = registerRes.body.data.user.id;
    const farToken = registerRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${farToken}`)
      .send({ name: 'Uzak Fatura', category: 'Diğer', amount: 100, dueDate: daysFromNow(60) });

    await notificationsService.generateDueReminders(farUserId);
    const list = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${farToken}`)
      .expect(200);
    expect(list.body.data.length).toBe(0);
  });

  it('marks a reminder as read and enforces ownership', async () => {
    const otherEmail = `e2e-notifications-other-${Date.now()}@atlas.dev`;
    const otherRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: otherEmail, password: 'SifreGuclu123' });
    const otherToken = otherRegisterRes.body.data.accessToken;

    const list = await request(app.getHttpServer())
      .get('/notifications/upcoming')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const reminderId = list.body.data[0].id;

    await request(app.getHttpServer())
      .patch(`/notifications/${reminderId}/read`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    const marked = await request(app.getHttpServer())
      .patch(`/notifications/${reminderId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(marked.body.data.readAt).not.toBeNull();

    const upcomingAfter = await request(app.getHttpServer())
      .get('/notifications/upcoming')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(upcomingAfter.body.data.some((r: { id: string }) => r.id === reminderId)).toBe(false);
  });

  it('generates an overdue (past due date) reminder as well', async () => {
    const overdueEmail = `e2e-notifications-overdue-${Date.now()}@atlas.dev`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: overdueEmail, password: 'SifreGuclu123' });
    const overdueUserId = registerRes.body.data.user.id;
    const overdueToken = registerRes.body.data.accessToken;

    await request(app.getHttpServer())
      .post('/bills')
      .set('Authorization', `Bearer ${overdueToken}`)
      .send({ name: 'Gecikmiş Fatura', category: 'Diğer', amount: 150, dueDate: daysAgo(2) });

    const result = await notificationsService.generateDueReminders(overdueUserId);
    expect(result.generated).toBeGreaterThan(0);
  });
});
