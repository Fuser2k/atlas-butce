import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:atlas_butce/main.dart';
import 'package:atlas_butce/features/auth/data/token_storage.dart';

/// Testte platform kanalı (flutter_secure_storage) çağrılmasın diye sahte depolama.
class _FakeTokenStorage extends TokenStorage {
  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<String?> readRefreshToken() async => null;

  @override
  Future<void> save({required String accessToken, required String refreshToken}) async {}

  @override
  Future<void> clear() async {}
}

void main() {
  testWidgets('Oturum yoksa giriş ekranına yönlendirilir', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [tokenStorageProvider.overrideWithValue(_FakeTokenStorage())],
        child: const AtlasApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ATLAS Bütçe'), findsOneWidget);
    expect(find.text('Giriş Yap'), findsOneWidget);
    expect(find.text('E-posta'), findsOneWidget);
    expect(find.text('Şifre'), findsOneWidget);
  });
}
