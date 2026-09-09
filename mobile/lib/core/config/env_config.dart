/// Dev/Test ortam ayrımı (Hafta 1, Başarı Kriteri #6).
/// Kullanım: flutter run --dart-define=ENV=dev --dart-define=API_BASE_URL=http://localhost:3000
enum AppEnv { dev, test }

class EnvConfig {
  final AppEnv env;
  final String apiBaseUrl;

  const EnvConfig({required this.env, required this.apiBaseUrl});

  static EnvConfig fromDartDefines() {
    const envName = String.fromEnvironment('ENV', defaultValue: 'dev');
    const apiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:3000',
    );

    final env = envName == 'test' ? AppEnv.test : AppEnv.dev;
    return EnvConfig(env: env, apiBaseUrl: apiBaseUrl);
  }
}
