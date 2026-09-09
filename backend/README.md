# ATLAS Bütçe — Backend

NestJS + PostgreSQL (Prisma ORM) tabanlı backend servisi. Mimari kararlar ve haftalık kapsam için
[docs/](../docs) klasörüne ve proje kökündeki `README.md`'ye bakınız.

## Kurulum

```bash
npm install
cp .env.example .env.dev
cp .env.example .env.test   # PORT ve DATABASE_URL'i test ortamına göre güncelleyin
```

## Dev/Test Ortamlarını Ayağa Kaldırma (Docker)

Proje kökünden:

```bash
docker compose up -d postgres-dev postgres-test
```

## Migration

```bash
npm run prisma:migrate:dev    # dev veritabanına migration uygular
npm run prisma:migrate:test   # test veritabanına migration uygular
```

## Çalıştırma

```bash
npm run start:dev        # dev ortamı (.env.dev, port 3000)
npm run start:test-env   # test ortamı (.env.test, port 3001)
```

## Test

```bash
npm run test       # unit testler
npm run test:e2e   # e2e testler (test veritabanı gerektirir)
```

## Modül Yapısı

```
src/
  common/        # global filter, interceptor, guard, decorator
  config/        # ortam konfigürasyonu
  prisma/        # PrismaService (pg adapter ile)
  modules/
    auth/        # kayıt, giriş, JWT (Madde 5.2)
    users/
    transactions/  # gelir/gider (Madde 5.4) — Hafta 2
    accounts/       # banka/kart/kredi/KMH (Madde 5.5) — Hafta 3
    bills/          # faturalar/hatırlatıcılar (Madde 5.6, 5.7) — Hafta 3
    household/      # hane halkı (Madde 5.8) — Hafta 4
    savings/        # birikim/hedef (Madde 5.9) — Hafta 4
    premium/        # abonelik (Madde 5.16) — Hafta 7
    public-debt/    # Kamu Borç Takip (Madde 5.14) — Hafta 6
    notifications/  # bildirimler (Madde 5.7)
    health/         # mobil ⇄ backend bağlantı testi
```

## Free/Premium Yetkilendirme

Backend seviyesinde kontrol için `@RequirePremium()` decorator + `PremiumGuard` kullanılır
(`src/common/decorators`, `src/common/guards`). Örnek:

```ts
@UseGuards(AuthGuard('jwt'), PremiumGuard)
@RequirePremium()
@Get('ai-suggestions')
getAiSuggestions() { ... }
```
