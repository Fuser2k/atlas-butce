# Risk ve İhtiyaç Listesi — Hafta 1

## Müşteriden Beklenen Bilgi/Erişimler (8 haftalık takvimin korunması için)

| Kalem | Durum | Not |
|---|---|---|
| Onaylı logo & görsel kimlik dosyaları | Bekleniyor | Mobil UI temasının (Madde 5.21) uygulanabilmesi için gerekli |
| Onaylı ekran tasarımları (varsa) | Bekleniyor | Yoksa Kordevo tarafından temel/işlevsel tasarım önerilecek |
| Domain & kurumsal e-posta bilgileri | Bekleniyor | Production ortamı bu domain üzerinden yayına alınacak (Madde 6) |
| Cloud/hosting hesap erişimleri | Kısmi | Dev/Test şimdilik Kordevo'nun Hetzner sunucusunda; production müşteri adına açılacak |
| Apple Developer hesabı | Bekleniyor | Madde 19 — müşteri adına açılması gerekiyor |
| Google Play geliştirici hesabı | Bekleniyor | Madde 19 — müşteri adına açılması gerekiyor |
| Ücretli servisler için onay | Bekleniyor | OCR/AI/Ses sağlayıcı seçimi netleşince (Hafta 5-6) alınacak |
| Gerekli API anahtarları & izinler | Bekleniyor | Sağlayıcı seçimi sonrası, müşteri adına açılan hesaplardan |
| Karar verecek yetkili temsilci | Bekleniyor | Ticari/hukuki onaylar için tek muhatap belirlenmeli |
| Free/Premium paket ticari kararları | Bekleniyor | Hangi özelliklerin Free/Premium'da kalacağı Madde 5.10/5.11'de teknik olarak sabit; fiyatlandırma müşteri kararı |
| Reklam kullanımı tercihi | Bekleniyor | Madde 5.17 — ücretsiz sürümde reklam gösterim sıklığı/ekranları müşteri belirleyecek |
| Kamu Borç Takip akışı değerlendirmesi | Bekleniyor | bkz. [public-debt-feasibility.md](./public-debt-feasibility.md) — Seçenek 2/3 üzerinde müşteri görüşü isteniyor |

## Teknik Riskler

| Risk | Etki | Azaltma |
|---|---|---|
| Resmi Dijital Vergi Dairesi sisteminde erişilebilir API bulunamaması | Kamu Borç Takip modülü kapsamı sınırlanabilir | Güvenli yönlendirme + manuel belge yükleme fallback'i (Madde 5.14 son paragraf ile uyumlu) |
| OCR'ın Türkçe fiş formatlarında düşük doğruluk vermesi | Premium OCR özelliği kullanıcı deneyimini olumsuz etkiler | Hafta 5 öncesi PoC ile sağlayıcı karşılaştırması, adapter pattern ile sağlayıcı değişimine açık mimari |
| Üçüncü taraf servis sağlayıcısının API'sini kapatması/koşul değiştirmesi | Bağımlı özellik çalışamaz hale gelebilir | Madde 5.19 uyarınca sorumluluk paylaşımı tanımlı; adapter/port mimarisiyle teknik geçiş kolaylaştırılıyor |
| App Store / Google Play mağaza inceleme reddi | Yayın takvimi kayabilir | Madde 19 uyarınca ek ücret talep edilmeksizin düzeltme yapılacak; mağaza hesapları erken açılmalı |
| Dev/Test ortamının tek sunucuda (Hetzner) barındırılması | Kaynak çakışması/performans riski düşük ama izole değilse veri karışma riski | Ayrı Docker container + ayrı PostgreSQL veritabanı ile izolasyon sağlandı |

## Bu Hafta Kapsam Dışı (Sözleşme ve Özet Rapor ile uyumlu, hatırlatma)

- Gelir-gider modülünün tüm ekranları, Banka/kredi kartı/KMH işlemlerinin tamamı
- Fatura & hatırlatma sisteminin tamamı, Premium satın almanın tamamı
- OCR ve AI önerilerinin canlıya alınması, Sesli işlemlerin tamamlanması
- Kamu Borç Takip nihai entegrasyonu, App Store / Google Play gönderimi
- Canlı production ortamının yayına açılması
