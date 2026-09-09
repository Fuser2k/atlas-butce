# Üçüncü Taraf Servis Değerlendirmesi — Hafta 1

> Not: Bu doküman sadece teknik seçenekleri ve kapsam notlarını içerir. AI, cloud, SMS, e-posta, ödeme
> altyapısı ve ücretli üçüncü taraf API maliyetleri sözleşme Madde 22 uyarınca proje bedeline dahil
> değildir. Ücretli servisler için müşteri onayı önceden alınacak; ilgili hesaplar müşteri adına açılacaktır.

## OCR (Fiş / Belge Tarama — Madde 5.12)

**İhtiyaç:** Fişten/belgeden tutar, tarih, satıcı adı ve harcama kategorisi çıkarımı; Türkçe okuma başarısı önemli.

| Aday | Not |
|---|---|
| Google Cloud Vision (Document AI) | Türkçe OCR başarısı yüksek, kullanım bazlı ücretlendirme |
| AWS Textract | Yapılandırılmış belge desteği iyi, Türkçe için ek doğrulama gerekebilir |
| Tesseract (self-hosted, açık kaynak) | Ücretsiz ama Türkçe fiş formatlarında doğruluk daha düşük, ek post-processing gerekir |

**Karar:** Hafta 5'te (Premium OCR fazı) somut prova (PoC) ile karşılaştırma yapılacak; bu hafta sadece
backend'de OCR sonucu için ortak bir DTO/arayüz (`ReceiptExtractionResult`) tasarlanacak, sağlayıcı seçimi
soyutlanmış (adapter pattern) bırakılacak.

## Yapay Zekâ (ATLAS Önerileri, Belge Özetleme — Madde 5.13, 5.15)

**İhtiyaç:** Kullanıcı finansal verisine dayalı öneri üretimi, belge özetleme, sınırlı soru-cevap.

| Aday | Not |
|---|---|
| Anthropic Claude API | Uzun bağlam, Türkçe kalitesi iyi, tool-use ile yapılandırılmış çıkış üretilebilir |
| OpenAI API | Alternatif, benzer yetenekler |

**Kapsam notu:** Öneriler "yatırım danışmanlığı veya kredi verme taahhüdü niteliğinde olmayacak" (Madde 5.13).
İstek/cevap sınırları (rate limit, günlük kota) Premium fazında netleştirilecek. Bu hafta sadece
`AiProviderPort` arayüzü (adapter) tasarlanacak, gerçek entegrasyon yok.

## Ses (Sesli İşlem, Sesli Brifing — Madde 5.11.A/B/C)

**İhtiyaç:** Türkçe komut → metin dönüşümü, sesli günlük brifing üretimi (metin → ses).

| Aday | Not |
|---|---|
| Google Speech-to-Text / Text-to-Speech | Türkçe desteği olgun |
| Whisper (self-hosted) | STT için ücretsiz alternatif, maliyet kontrolü sağlar |

**Maliyet notu:** Ses servisleri kullanım bazlı faturalandığından maliyet analizi Hafta 5 öncesi ayrıca
raporlanacak (Madde 22 kapsamında müşteri onayı gerekli).

## Abonelik (App Store & Google Play Satın Alma Doğrulama — Madde 5.16)

**İhtiyaç:** Premium abonelik satın alma, doğrulama, üyelik durumunun backend'de tutulması.

- **iOS:** App Store Server API / StoreKit 2 receipt validation
- **Android:** Google Play Developer API (Purchases.subscriptions)
- Premium durumu backend'de tek doğruluk kaynağı (single source of truth) olacak; mobil taraf sadece
  bu durumu backend'den okuyup gösterecek (Madde 5.10/5.11 ile uyumlu).

Bu hafta: `PremiumSubscription` veri modeli ve `@RequirePremium()` guard tasarımı hazırlandı (gerçek mağaza
entegrasyonu Hafta 7 kapsamında).

## Bildirim (Ödeme/Hedef Hatırlatmaları — Madde 5.7)

**İhtiyaç:** Ödeme tarihi, kredi taksiti, hedef ilerleme bildirimleri.

- **Öncelik:** Push bildirim (Firebase Cloud Messaging — ücretsiz katman genelde yeterli)
- **Kapsam dışı:** SMS/e-posta gönderim maliyeti (özet raporda ve Madde 22'de açıkça belirtilmiş)

Bu hafta: Bildirim altyapısı için backend'de `NotificationsModule` iskeleti (boş) oluşturuldu; gerçek FCM
entegrasyonu ilgili modülün geliştirileceği haftada yapılacak.

## Genel Prensip

Tüm yukarıdaki entegrasyonlar backend içinde **adapter/port pattern** ile soyutlanacak; böylece bir
sağlayıcının API'sini kapatması veya koşullarını değiştirmesi durumunda (Madde 5.19) alternatif sağlayıcıya
geçiş, ATLAS'ın temel iş mantığını değiştirmeden yapılabilecek.
