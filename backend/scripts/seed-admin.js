// Admin kullanıcı oluşturma script'i. Idempotent: aynı e-posta zaten varsa
// hiçbir şey yapmaz. Kaynak kodda sabit credential bulunmaz — sadece ortam
// değişkenlerinden (ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD) okur.
//
// Kullanım: npm run seed:admin:dev  /  npm run seed:admin:test
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'dev';
dotenv.config({ path: `.env.${env}` });

const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!email || !password) {
  console.error('ADMIN_SEED_EMAIL ve ADMIN_SEED_PASSWORD ortam değişkenleri gerekli.');
  process.exit(1);
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const existing = await prisma.adminUser.findUnique({ where: { email } });
if (existing) {
  console.log(`Admin zaten mevcut: ${email} (işlem yapılmadı).`);
  await prisma.$disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
const admin = await prisma.adminUser.create({
  data: { email, passwordHash, role: 'SUPER_ADMIN' },
});

console.log(`Admin oluşturuldu: ${admin.email} (${admin.role})`);
await prisma.$disconnect();
