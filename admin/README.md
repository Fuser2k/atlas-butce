# ATLAS Admin — Yönetim Paneli (V0.1)

Next.js (App Router, TypeScript, Tailwind) tabanlı admin web paneli. Mevcut NestJS backend'i
kullanır (ayrı bir ikinci backend yok).

## Mimari Notlar

- **Auth izolasyonu:** Admin girişi mobil kullanıcı auth sisteminden tamamen ayrı
  (`ADMIN_JWT_SECRET` ile imzalanmış, farklı bir passport stratejisi: `admin-jwt`).
- **Token saklama:** Admin JWT tarayıcıda **localStorage'a yazılmaz**. `/api/auth/login`
  route handler'ı (BFF) backend'e login isteği atar, dönen token'ı `httpOnly` cookie olarak
  set eder. Sunucu bileşenleri (`lib/backend.ts`) bu cookie'yi okuyup backend'e Authorization
  header'ı ile istek atar.
- **Middleware:** Oturum cookie'si yoksa korumalı rotalara erişim `/login`'e yönlendirilir.

## Kurulum

```bash
npm install
cp .env.example .env.local   # BACKEND_URL'i gerekirse güncelleyin
```

## Admin Hesabı Oluşturma

Panelde giriş yapabilmek için backend tarafında bir admin hesabı olması gerekir:

```bash
cd ../backend
npm run seed:admin:dev
```

(`.env.dev` içindeki `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` ile oluşturulur, idempotent'tir.)

## Çalıştırma

```bash
npm run dev
```

Backend'in (`../backend`) ayrı bir terminalde `npm run start:dev` ile çalışıyor olması gerekir.

## Sayfalar

- `/login` — admin girişi
- `/dashboard` — toplam/aktif/silinmiş/free/premium kullanıcı sayıları, son 7 günde yeni kayıt
- `/users` — arama (isim/e-posta) + tier filtresi + sayfalama
- `/users/[id]` — kullanıcı detayı (yalnızca temel bilgiler — finansal veri **gösterilmez**)

## Gizlilik

Bu panel V0.1 kapsamında kullanıcının gelir/gider, banka, kart veya kredi bilgilerini
göstermez — sadece hesap düzeyinde operasyonel görünürlük sağlar.
