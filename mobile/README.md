# ATLAS Bütçe — Mobile (Flutter)

> **Durum:** Bu makinede Flutter SDK kurulu değildi, bu nedenle `flutter create` ile proje iskeleti
> henüz oluşturulamadı. Flutter SDK kurulduktan sonra aşağıdaki adımları takip ederek iskeleti
> tamamlayınız.

## Kurulum Adımları (Flutter SDK kurulduktan sonra)

```bash
cd mobile
flutter create --org com.kordevo.atlas --platforms=ios,android .
flutter pub add flutter_riverpod go_router dio flutter_screenutil
flutter pub add -d riverpod_generator build_runner
```

## Planlanan Klasör Yapısı (Clean Architecture + Riverpod)

```
lib/
  core/
    config/          # ENV (dev/test) bazlı API base URL
    network/          # dio client, interceptors (hata/log)
    theme/
    router/           # go_router tanımları (9 ana ekran)
  features/
    auth/
      data/
      domain/
      presentation/
    home/              # Ana Ekran (finansal özet)
    transactions/       # Gelir/Gider
    accounts/            # Finansal Hesaplar (banka/kart/kredi/KMH)
    bills/                # Faturalar
    household/            # Hane Halkı
    savings/               # Birikim/Hedefler
    public_debt/            # Kamu Borç Takip
    premium/                 # Premium Alanı
    settings/                 # Profil/Ayarlar
main.dart
```

## Navigasyon (Madde 5.3 / Özet Rapor Bölüm 5 ile uyumlu)

`go_router` ile 9 ana rota: Ana Ekran, Gelir/Gider, Finansal Hesaplar, Faturalar, Hane Halkı,
Birikim/Hedefler, Kamu Borç Takip, Premium Alanı, Profil/Ayarlar.

## Ortam (Dev/Test) Ayrımı

```bash
flutter run --dart-define=ENV=dev --dart-define=API_BASE_URL=http://localhost:3000
flutter run --dart-define=ENV=test --dart-define=API_BASE_URL=http://localhost:3001
```

`lib/core/config` içinde bu değerler okunup `dio` base URL'ine aktarılacaktır.

## Free/Premium Gate

Backend `/auth/me` (veya ilgili endpoint) üzerinden dönen `tier` alanına göre; Premium'a özel
ekranlarda `PremiumGateWidget` (planlanan) kullanıcıyı yönlendirecek/kısıtlayacaktır. Gerçek
yetkilendirme her zaman backend'de (`PremiumGuard`) doğrulanır; mobil taraftaki kontrol sadece UX
amaçlıdır.
