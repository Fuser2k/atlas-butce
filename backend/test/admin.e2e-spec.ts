import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let mobileUserToken: string;

  const adminEmail = `e2e-admin-${Date.now()}@atlas.dev`;
  const adminPassword = 'AdminSifreGuclu123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Test fixture: programatik admin oluşturma (seed script'ine bağımlı değil).
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: { email: adminEmail, passwordHash, role: 'SUPER_ADMIN' },
    });

    // Karşılaştırma için birkaç mobil kullanıcı oluştur.
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `e2e-admin-target-1-${Date.now()}@atlas.dev`, password: 'SifreGuclu123', fullName: 'Ahmet Yilmaz' });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `e2e-admin-target-2-${Date.now()}@atlas.dev`, password: 'SifreGuclu123', fullName: 'Zeynep Kaya' });

    const mobileRegisterRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: `e2e-admin-mobileuser-${Date.now()}@atlas.dev`, password: 'SifreGuclu123' });
    mobileUserToken = mobileRegisterRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in with valid admin credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.admin.email).toBe(adminEmail);
    adminToken = res.body.data.accessToken;
  });

  it('rejects invalid admin credentials', async () => {
    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: adminEmail, password: 'yanlis-sifre' })
      .expect(401);
  });

  it('rejects unauthenticated access to admin endpoints', async () => {
    await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
  });

  it('rejects a mobile user JWT on admin endpoints', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${mobileUserToken}`)
      .expect(401);
  });

  it('returns correct dashboard metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(typeof res.body.data.totalUsers).toBe('number');
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
    expect(res.body.data.freeUsers + res.body.data.premiumUsers).toBeLessThanOrEqual(res.body.data.activeUsers);
    expect(res.body.data.newUsersLast7Days).toBeGreaterThanOrEqual(3);
  });

  it('supports searching users by name/email', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .query({ search: 'Zeynep' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((u: { fullName: string }) => u.fullName?.includes('Zeynep'))).toBe(true);
  });

  it('supports filtering users by tier', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users')
      .query({ tier: 'FREE' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.items.every((u: { tier: string }) => u.tier === 'FREE')).toBe(true);
  });

  it('returns user detail without sensitive fields', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/admin/users')
      .query({ search: 'Ahmet' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const userId = listRes.body.data.items[0].id;

    const detailRes = await request(app.getHttpServer())
      .get(`/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const keys = Object.keys(detailRes.body.data);
    expect(keys).not.toContain('passwordHash');
    expect(keys).not.toContain('passwordResetTokenHash');
    expect(keys).not.toContain('transactions');
    expect(detailRes.body.data.email).toBeTruthy();
  });
});
