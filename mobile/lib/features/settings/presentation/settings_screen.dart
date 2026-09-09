import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.value?.user;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        if (user != null) ...[
          Text('Hesap Bilgileri', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: Text(user.email),
            subtitle: const Text('E-posta'),
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(user.fullName ?? '—'),
            subtitle: const Text('Ad Soyad'),
            trailing: IconButton(
              icon: const Icon(Icons.edit_outlined),
              onPressed: () => _showEditNameDialog(context, ref, user.fullName),
            ),
          ),
          ListTile(
            leading: Icon(user.isPremium ? Icons.workspace_premium : Icons.star_border),
            title: Text(user.isPremium ? 'Premium' : 'Free'),
            subtitle: const Text('Üyelik durumu'),
          ),
          const Divider(height: 32),
        ],
        FilledButton.tonal(
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          child: const Text('Çıkış Yap'),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
          onPressed: () => _confirmDeleteAccount(context, ref),
          child: const Text('Hesabımı Sil'),
        ),
      ],
    );
  }

  Future<void> _showEditNameDialog(BuildContext context, WidgetRef ref, String? currentName) async {
    final controller = TextEditingController(text: currentName);
    final newName = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Ad Soyad Güncelle'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('İptal')),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim()),
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty) {
      await ref.read(authControllerProvider.notifier).updateFullName(newName);
    }
  }

  Future<void> _confirmDeleteAccount(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hesabı Sil'),
        content: const Text('Hesabınız silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('İptal')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authControllerProvider.notifier).deleteAccount();
    }
  }
}
