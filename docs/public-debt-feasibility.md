# Kamu Borç Takip Modülü — Ön Fizibilite Notu (Hafta 1)

Sözleşme Madde 5.14 kapsamındaki "Dijital Vergi Dairesi / Kamu Borç Takip Modülü" için geliştirmeye
başlamadan önceki ön değerlendirme notudur. Nihai teknik/hukuki karar Hafta 6'da modülün geliştirileceği
dönemde kesinleştirilecektir.

## Kırmızı Çizgi (Sözleşme Madde 5.14 — Değiştirilemez)

> CAPTCHA, iki faktörlü doğrulama, e-Devlet güvenliği veya resmi kurumların diğer güvenlik önlemlerini
> hukuka veya platform kurallarına aykırı biçimde aşan hiçbir yöntem kullanılmayacaktır.

Bu ilke, aşağıdaki tüm seçeneklerin ortak ön koşuludur.

## Değerlendirilen Yöntemler

### 1. Resmi API Erişimi (öncelikli seçenek)
- Dijital Vergi Dairesi / GİB tarafında resmi, belgelenmiş bir API'nin var olup olmadığı araştırılacak.
- **Avantaj:** Kullanıcı kimlik bilgisi saklamadan, güvenli ve sürdürülebilir entegrasyon.
- **Risk:** Böyle bir API kamuya açık/erişilebilir olmayabilir; bu durumda seçenek 2'ye geçilir.

### 2. Güvenli Yönlendirme (In-App Browser / WebView)
- Kullanıcı, uygulama içi tarayıcı (in-app browser) veya WebView üzerinden doğrudan resmi sisteme
  yönlendirilir; giriş işlemi tamamen resmi sistem arayüzünde, kullanıcının kendi bilgileriyle yapılır.
- ATLAS, kullanıcı adı/şifre gibi kimlik bilgilerini **hiçbir şekilde saklamaz veya işlemez**.
- Giriş sonrası erişilebilen desteklenen ekran/belgelerdeki bilgiler (borç, belge, e-tebligat) uygun
  olduğu ölçüde uygulama tarafından okunup ATLAS içinde görüntülenebilir/analiz edilebilir.
- **Not:** CAPTCHA/2FA/e-Devlet güvenlik adımlarını otomatikleştirme veya atlama girişimi
  **kesinlikle yapılmayacaktır** — kullanıcı bu adımları kendisi tamamlar.

### 3. Manuel Belge Yükleme (asgari/fallback yöntem)
- Kullanıcı, resmi sistemden kendi indirdiği PDF/görsel belgeyi ATLAS'a manuel olarak yükler.
- Premium kullanıcılar için bu belge AI ile özetlenebilir (Madde 5.15 ile entegre).
- **Önemli:** Sözleşmeye göre bu yöntem tek başına "Dijital Vergi Dairesi/Kamu Borç Takip fonksiyonunun
  tamamı yerine geçmiş" sayılmaz — sadece tamamlayıcı bir asgari yöntemdir.

## Teknik Erişim Kısıtı Senaryosu

Resmi sistemlerdeki teknik veya hukuki erişim kısıtları nedeniyle otomatik veri alınmasının mümkün
olmadığı durumlarda, uygulama en azından kullanıcıyı ilgili resmi ekrana **uygulama içinden veya güvenli
yönlendirme ile** ulaştıracak şekilde tasarlanacaktır (Madde 5.14, son paragraf).

## Kullanıcı Kimlik Bilgisi Prensibi

- Kullanıcının resmi sisteme ait şifresi/kimlik bilgisi **ATLAS backend'inde asla düz metin veya
  kalıcı olarak saklanmaz.**
- Mümkün olan tüm akışlarda kimlik doğrulama resmi sistemin kendi arayüzünde gerçekleşir; ATLAS sadece
  sonuç ekranındaki/belgesindeki bilgiyi (kullanıcı onayıyla) okur.

## Hafta 1 Sonu Durumu

- Bu modül için henüz kod geliştirilmedi (özet raporda "Kamu Borç Takip araştırması başlamış" başarı
  kriteri #9 ile uyumlu — sadece fizibilite/araştırma aşaması).
- Backend'de `PublicDebtModule` adında **boş** bir modül iskeleti oluşturuldu; gerçek implementasyon
  Hafta 6'da bu nottaki karar doğrultusunda (muhtemelen Seçenek 2 + Seçenek 3 kombinasyonu) yapılacak.
- Müşteriden Hafta 1 sonunda "Kamu Borç Takip akışı değerlendirmesi" için görüş/onay bekleniyor
  (bkz. [risks-and-needs.md](./risks-and-needs.md)).
