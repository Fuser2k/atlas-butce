import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

/// Mobil ⇄ Backend bağlantı testi (Hafta 1, Başarı Kriteri #2 ve #3).
final healthCheckProvider = FutureProvider.autoDispose((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/health');
  return response.data as Map<String, dynamic>;
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthCheckProvider);
    final env = ref.watch(envConfigProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Toplam gelir / gider / mevcut para', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          const Text('Gelir/Gider modülü Hafta 2 kapsamında eklenecek.'),
          const SizedBox(height: 24),
          Text('Backend Bağlantı Testi (${env.env.name})', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          health.when(
            data: (data) => Card(
              color: Colors.green.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text('✓ Backend bağlantısı başarılı: ${data.toString()}'),
              ),
            ),
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
            error: (error, _) => Card(
              color: Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text('✗ Backend bağlantısı başarısız: $error\n\nBaseUrl: ${env.apiBaseUrl}'),
              ),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () => ref.invalidate(healthCheckProvider),
            child: const Text('Yeniden Dene'),
          ),
        ],
      ),
    );
  }
}
