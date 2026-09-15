import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_controller.dart';

class _LockedFeature {
  final String title;
  final IconData icon;

  const _LockedFeature(this.title, this.icon);
}

const _lockedFeatures = [
  _LockedFeature('Sesli İşlem Girişi', Icons.mic_outlined),
  _LockedFeature('Sesli Günlük Brifing', Icons.record_voice_over_outlined),
  _LockedFeature('Sesli Soru-Cevap', Icons.question_answer_outlined),
  _LockedFeature('Fiş/Fatura OCR Tarama', Icons.document_scanner_outlined),
  _LockedFeature('AI Belge Yorumlama', Icons.psychology_outlined),
  _LockedFeature('ATLAS AI Önerileri', Icons.auto_awesome_outlined),
];

/// Madde 5.10/5.11/5.16 — Free kullanıcı Premium özelliklerin varlığını
/// görebilmeli; satın alma akışı bu haftanın kapsamında değildir.
class PremiumScreen extends ConsumerWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).value?.user;
    final isPremium = user?.isPremium ?? false;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          color: isPremium
              ? Theme.of(context).colorScheme.primaryContainer
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(
                  isPremium ? Icons.workspace_premium : Icons.workspace_premium_outlined,
                  size: 36,
                  color: isPremium ? Theme.of(context).colorScheme.primary : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isPremium ? 'Premium Üyeliğiniz Aktif' : 'Şu an Free plandasınız',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isPremium
                            ? 'Tüm ATLAS özellikleri kullanımınıza açık.'
                            : 'Temel bütçe yönetimi özelliklerinin tamamı ücretsizdir. Aşağıdaki gelişmiş özellikler Premium ile birlikte gelecektir.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text('Premium ile Gelecek Özellikler', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        for (final feature in _lockedFeatures)
          Card(
            child: ListTile(
              leading: Icon(feature.icon, color: isPremium ? null : Colors.grey),
              title: Text(feature.title),
              trailing: isPremium
                  ? const Icon(Icons.check_circle_outline, color: Colors.green)
                  : const Icon(Icons.lock_outline, color: Colors.grey),
              enabled: isPremium,
              onTap: isPremium ? null : () => _showComingSoon(context, feature.title),
            ),
          ),
        if (!isPremium) ...[
          const SizedBox(height: 16),
          Text(
            'Premium satın alma akışı henüz bu sürümde aktif değildir.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ],
    );
  }

  void _showComingSoon(BuildContext context, String featureTitle) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(featureTitle),
        content: const Text('Bu özellik Premium üyelik ile birlikte sunulacaktır. Şu an geliştirme aşamasındadır.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Tamam')),
        ],
      ),
    );
  }
}
