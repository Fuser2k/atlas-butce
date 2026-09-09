# ATLAS Bütçe — Mobile (Flutter)

Flutter (Riverpod + Clean Architecture) mobil uygulaması. iOS + Android hedefleri için oluşturuldu.

> **Önemli — Proje yolu:** Bu proje **ASCII karakterli bir yolda** olmalıdır (örn. `C:\dev\...`).
> Android Gradle, yol içinde Türkçe karakter (ör. "ü", "ş", "ı") varsa build'i reddeder
> ("project path contains non-ASCII characters"). Bu depo başlangıçta
> `OneDrive\Masaüstü\...` altındaydı ve bu hatayla karşılaşıldı; `C:\dev\atlas-mobil-uygulama`'ya
> taşınarak çözüldü. Projeyi klonlarken/taşırken bu kurala uyun.

## Kurulum

```bash
cd mobile
flutter pub get
```

## Çalıştırma (Dev/Test Ortam Ayrımı)

```bash
# Android emulator — 10.0.2.2, emulator'ün host makineye erişim adresidir
flutter run --dart-define=ENV=dev --dart-define=API_BASE_URL=http://10.0.2.2:3000

# Fiziksel cihaz / Windows desktop / web — host makine IP'si veya localhost
flutter run --dart-define=ENV=test --dart-define=API_BASE_URL=http://localhost:3001
```

## Klasör Yapısı (Clean Architecture + Riverpod)

```
lib/
  core/
    config/     # env_config.dart — ENV/API_BASE_URL (dart-define)
    network/    # api_client.dart — dio + hata interceptor
    theme/      # app_theme.dart
    router/     # app_router.dart, app_shell.dart (9 ana rota + Drawer navigasyonu)
  features/
    home/            # Ana Ekran — backend bağlantı testi burada
    auth/
    transactions/    # Gelir/Gider — Hafta 2
    accounts/        # Banka/Kart/Kredi/KMH — Hafta 3
    bills/           # Faturalar — Hafta 3
    household/       # Hane Halkı — Hafta 4
    savings/         # Birikim/Hedefler — Hafta 4
    public_debt/     # Kamu Borç Takip — Hafta 6
    premium/         # Premium Alanı — Hafta 5-7
    settings/        # Profil/Ayarlar — Hafta 2
main.dart
```

Her feature klasörü `data/domain/presentation` alt katmanlarına sahiptir; henüz sadece
`presentation` dolu (placeholder ekranlar), `data`/`domain` ilgili hafta geldiğinde doldurulacak.

## Doğrulandı (Hafta 1)

- `flutter build apk --debug` başarılı
- Android emulator'de (`sdk gphone64 x86 64`, API 36) kurulup çalıştırıldı
- Ana ekranda backend `/health` endpoint'ine gerçek istek atılıp `database: up` cevabı alındı
- Drawer navigasyonunda 9 ana rota (Ana Ekran, Gelir/Gider, Finansal Hesaplar, Faturalar,
  Hane Halkı, Birikim/Hedefler, Kamu Borç Takip, Premium Alanı, Profil/Ayarlar) doğrulandı
- `flutter test` (widget testi) geçti

## Free/Premium Gate

Backend `/auth/me` üzerinden dönen `tier` alanına göre; Premium'a özel ekranlarda bir
`PremiumGateWidget` (Hafta 4-5 kapsamında eklenecek) kullanıcıyı yönlendirecek/kısıtlayacaktır.
Gerçek yetkilendirme her zaman backend'de (`PremiumGuard`) doğrulanır; mobil taraftaki kontrol
sadece UX amaçlıdır.
