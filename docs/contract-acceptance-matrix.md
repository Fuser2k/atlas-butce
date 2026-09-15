# ATLAS Bütçe — Sözleşme Madde 5 Kabul Matrisi

Bu belge sözleşmenin Madde 5 kapsamındaki her maddenin gerçek implementasyon
ve test durumunu takip eder. Durumlar iyimser değil, gerçek kod/test kanıtına
göre işaretlenir. Son güncelleme: Hafta 4 kapanışı (2026-09-15).

| Sözleşme Maddesi | Özellik | Backend | Mobil | Otomatik Test | Manuel Test | Durum | Notlar |
|---|---|---|---|---|---|---|---|
| 5.2 | Kullanıcı Hesap Yönetimi | ✅ | ✅ | ✅ (auth e2e) | PARTIAL | PASS | Şifre sıfırlama e-posta servisi yok (teknik borç). |
| 5.3 | Ana Ekran ve Finansal Özet | ✅ (V3: distribution, planning, briefing) | ✅ (Dashboard V3) | ✅ | PARTIAL | PASS | Gerçek Android UI click-through bu haftada kısmi yapıldı; iş mantığı API seviyesinde tam doğrulandı. |
| 5.4 | Gelir ve Gider Yönetimi | ✅ | ✅ | ✅ | PASS (Hafta 2-3'te) | PASS | Hane üyesi bağlama Hafta 4'te eklendi. |
| 5.5 | Banka/Kart/Kredi/KMH | ✅ | ✅ | ✅ (36 test) | PASS (Hafta 3) | PASS | OVERDRAFT usedAmount<=limit kuralı Hafta 4'te eklendi. |
| 5.6 | Faturalar ve Sabit Ödemeler | ✅ | ✅ | ✅ | PASS (Hafta 3) | PASS | Ödeme geçmişi tablosu yok (bilinçli teknik borç). |
| 5.7 | Ödeme Hatırlatıcıları | ✅ (ortak reminder motoru) | ✅ (liste + okundu işaretleme) | ✅ (8 test) | PARTIAL | PASS | Gerçek push bildirimi yok (harici provider credential'ı yok); local liste + gelecekte push için hazır soyutlama var. |
| 5.8 | Hane Halkı Yönetimi | ✅ | ✅ | ✅ (7 test) | PARTIAL | PASS | |
| 5.9 | Birikim ve Finansal Hedef | ✅ | ✅ | ✅ (12 test) | PARTIAL | PASS | paceStatus deterministic kural tabanlı (AI değil). |
| 5.10 | Free Sürüm | ✅ (tüm Free endpoint'ler açık) | ✅ | ✅ | PARTIAL | PASS | Bu haftanın tüm yeni özellikleri Free kapsamında. |
| 5.11 | Premium — Sesli Özellikler | ⛔ | ⛔ (kilitli önizleme var) | — | — | NOT_STARTED | Bilinçli olarak bu hafta kapsam dışı (ses/AI). |
| 5.12 | OCR | ⛔ | ⛔ | — | — | NOT_STARTED | Kapsam dışı (bu hafta). |
| 5.13 | ATLAS AI Önerileri | ⛔ | ⛔ | — | — | NOT_STARTED | Kapsam dışı; günlük brifing kural tabanlı, AI değil. |
| 5.14 | Kamu Borç Takip | ⛔ (gerçek entegrasyon yok) | ✅ (giriş/hazırlık ekranı + Dashboard kartı) | — | PASS (nav) | PARTIAL | Yalnızca giriş noktası; gerçek entegrasyon Hafta 6. |
| 5.15 | AI Belge Yorumlama | ⛔ | ⛔ | — | — | NOT_STARTED | Kapsam dışı. |
| 5.16 | Premium Abonelik | ⚪ (model var, doğrulama yok) | ✅ (tier görünür, satın alma yok) | — | PARTIAL | PARTIAL | Store receipt validation Hafta 7 kapsamında. |
| 5.17 | Reklamlar | ⛔ | ⛔ | — | — | NOT_STARTED | Kapsam dışı. |
| 5.18 | Backend Altyapısı | ✅ | — | ✅ (68 e2e test) | PASS | PASS | NestJS + Prisma + PostgreSQL, Docker Compose (dev/test). |
| 5.19 | Üçüncü Taraf Entegrasyonlar | ⚪ | ⚪ | — | — | NOT_STARTED | Değerlendirme dokümanı mevcut (`3rd-party-service-evaluation.md`); entegrasyon yok. |
| 5.20 | iOS/Android | — | ✅ (Android) / ⛔ (iOS) | ✅ (flutter test) | PARTIAL (Android) | PARTIAL | iOS hiç build edilmedi (Mac erişimi yok). |
| 5.21 | Tasarım/UX | — | ✅ (Material, tutarlı form pattern'leri) | — | PARTIAL | PASS | Var olan tasarım sistemi genişletildi, yeni bir tasarım sistemi yazılmadı. |
| 5.22 | Kabul Kriterleri | — | — | ✅ | PARTIAL | PASS | Bu matris, her hafta sonunda güncellenmelidir. |

## Lejant

- ✅ Tamamlandı ve doğrulandı
- ⚪ Kısmen mevcut / hazırlık aşamasında
- ⛔ Henüz başlanmadı (bilinçli kapsam dışı)
- PASS / PARTIAL / NOT_STARTED / BLOCKED — sütun bazlı gerçek durum

## Güncelleme Kuralı

Bu dosya her hafta kapanışında (haftalık execution promptunun son fazında)
gerçek test ve implementasyon kanıtına göre güncellenmelidir. İyimser
işaretleme yapılmamalıdır; PARTIAL/NOT_STARTED durumları açıkça nedenleriyle
belirtilmelidir.
