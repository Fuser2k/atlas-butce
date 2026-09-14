import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';
import { TransactionsService } from './../src/modules/transactions/transactions.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Recurring transactions engine (e2e)', () => {
  let app: INestApplication<App>;
  let transactionsService: TransactionsService;
  let prisma: PrismaService;
  let accessToken: string;

  const email = `e2e-recurring-${Date.now()}@atlas.dev`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    transactionsService = moduleFixture.get(TransactionsService);
    prisma = moduleFixture.get(PrismaService);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SifreGuclu123' });
    accessToken = registerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a child transaction and advances nextOccurrenceDate when a template is due', async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setUTCDate(eightDaysAgo.getUTCDate() - 8);

    const createRes = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'EXPENSE',
        amount: 500,
        category: 'Abonelik',
        date: eightDaysAgo.toISOString(),
        recurrence: 'RECURRING',
        recurrenceInterval: 'WEEKLY',
      })
      .expect(201);

    const templateId = createRes.body.data.id;
    const templateBefore = await prisma.transaction.findUniqueOrThrow({ where: { id: templateId } });

    // date 8 gün önce + 7 gün (WEEKLY) = 1 gün önce -> "due" (nextOccurrenceDate <= now)
    expect(templateBefore.nextOccurrenceDate).not.toBeNull();
    expect(templateBefore.nextOccurrenceDate!.getTime()).toBeLessThanOrEqual(Date.now());

    const result = await transactionsService.generateDueRecurringTransactions();
    expect(result.generated).toBeGreaterThanOrEqual(1);

    const children = await prisma.transaction.findMany({ where: { recurrenceParentId: templateId } });
    expect(children).toHaveLength(1);
    expect(children[0].recurrence).toBe('ONE_OFF');
    expect(children[0].amount.toString()).toBe('500');
    expect(children[0].date.getTime()).toBe(templateBefore.nextOccurrenceDate!.getTime());

    const templateAfter = await prisma.transaction.findUniqueOrThrow({ where: { id: templateId } });
    const expectedNext = new Date(templateBefore.nextOccurrenceDate!);
    expectedNext.setUTCDate(expectedNext.getUTCDate() + 7);
    expect(templateAfter.nextOccurrenceDate!.getTime()).toBe(expectedNext.getTime());

    // İkinci çalıştırmada artık due değil, tekrar çocuk üretilmemeli.
    const secondRun = await transactionsService.generateDueRecurringTransactions();
    const childrenAfterSecondRun = await prisma.transaction.findMany({ where: { recurrenceParentId: templateId } });
    expect(childrenAfterSecondRun).toHaveLength(1);
    expect(secondRun.generated).toBe(0);
  });
});
