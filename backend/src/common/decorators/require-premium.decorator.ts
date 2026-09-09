import { SetMetadata } from '@nestjs/common';

// Madde 5.10/5.11 — Free/Premium yetkilendirme sistem seviyesinde (backend) kontrol edilir,
// sadece ekran gizleme ile sınırlı değildir. Bir endpoint'i Premium'a kısıtlamak için kullanılır.
export const REQUIRE_PREMIUM_KEY = 'requirePremium';
export const RequirePremium = () => SetMetadata(REQUIRE_PREMIUM_KEY, true);
