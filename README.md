# ATLAS Bütçe

Kişisel bütçe/finans yönetimi mobil uygulaması (iOS + Android). Kordevo Soft tarafından geliştirilmektedir.

## Proje Yapısı

```
atlas-mobil-uygulama/
  mobile/     # Flutter uygulaması (Riverpod + Clean Architecture)
  backend/    # NestJS backend (PostgreSQL + Prisma)
  docs/       # Teknik değerlendirme, risk listesi, fizibilite notları
```

## Mimari Kararlar

- **Backend:** Node.js + NestJS + PostgreSQL (Prisma ORM)
- **Mobile:** Flutter, Riverpod + Clean Architecture
- **Dev/Test Hosting:** Hetzner sunucusu (Docker); production müşterinin alacağı domain ile yapılandırılacak

## Haftalık Plan

Sözleşme Madde 5 kapsamının 8 haftalık dağılımı ve Hafta 1 detaylı uygulama planı için proje planına
(`.claude/plans` veya ilgili proje yönetim aracına) bakınız. Kısa özet:

| Hafta | Kapsam |
|---|---|
| 1 | Teknik altyapı: mobil/backend iskelet, DB taslağı, auth taslağı, navigasyon, 3. taraf servis değerlendirmesi |
| 2 | Kullanıcı yönetimi + Gelir/Gider modülü |
| 3 | Banka/Kart/Kredi/KMH + Faturalar & Hatırlatıcılar |
| 4 | Hane Halkı + Birikim/Hedefler + Free/Premium erişim kısıtları |
| 5 | Premium: Sesli İşlem/Brifing + OCR |
| 6 | ATLAS Önerileri (AI) + Kamu Borç Takip + AI Belge Yorumlama |
| 7 | Premium Abonelik Sistemi + Reklam altyapısı + Mağaza hazırlığı |
| 8 | Test, kabul, nihai teslim |

## Hızlı Başlangıç

```bash
# Backend
cd backend
npm install
cp .env.example .env.dev
cp .env.example .env.test
cd ..
docker compose up -d postgres-dev postgres-test
cd backend
npm run prisma:migrate:dev
npm run start:dev

# Mobile (Flutter SDK gerekli)
cd mobile
flutter pub get
flutter run
```

Detaylar için [backend/README.md](./backend/README.md) ve [mobile/README.md](./mobile/README.md)'ye bakınız.

## Dokümantasyon

- [docs/3rd-party-service-evaluation.md](./docs/3rd-party-service-evaluation.md) — OCR/AI/Ses/Abonelik/Bildirim değerlendirmesi
- [docs/public-debt-feasibility.md](./docs/public-debt-feasibility.md) — Kamu Borç Takip ön fizibilite notu
- [docs/risks-and-needs.md](./docs/risks-and-needs.md) — Risk ve müşteriden beklenen bilgi/erişim listesi
