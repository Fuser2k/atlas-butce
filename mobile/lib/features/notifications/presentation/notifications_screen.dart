import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/notifications_repository.dart';
import '../domain/reminder_model.dart';

final notificationsListProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(notificationsRepositoryProvider).list();
});

const _sourceTypeLabels = {
  'BILL': 'Fatura',
  'CREDIT_CARD': 'Kredi Kartı',
  'LOAN': 'Kredi',
  'OVERDRAFT': 'KMH',
};

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reminders = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Hatırlatmalar')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(notificationsListProvider);
          await ref.read(notificationsListProvider.future);
        },
        child: reminders.when(
          data: (items) {
            if (items.isEmpty) {
              return const Center(child: Text('Şu an bir ödeme hatırlatmanız yok.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(),
              itemBuilder: (context, index) => _ReminderTile(
                reminder: items[index],
                onTap: () async {
                  if (items[index].isRead) return;
                  await ref.read(notificationsRepositoryProvider).markRead(items[index].id);
                  ref.invalidate(notificationsListProvider);
                },
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Hata: $error')),
        ),
      ),
    );
  }
}

class _ReminderTile extends StatelessWidget {
  final ReminderModel reminder;
  final VoidCallback onTap;

  const _ReminderTile({required this.reminder, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(
        reminder.isRead ? Icons.notifications_none : Icons.notifications_active,
        color: reminder.isRead ? null : Theme.of(context).colorScheme.primary,
      ),
      title: Text(
        reminder.title,
        style: TextStyle(fontWeight: reminder.isRead ? FontWeight.normal : FontWeight.bold),
      ),
      subtitle: Text(
        '${_sourceTypeLabels[reminder.sourceType] ?? reminder.sourceType} · ${reminder.body}\n'
        '${DateFormat('dd.MM.yyyy').format(reminder.scheduledAt)}',
      ),
      isThreeLine: true,
    );
  }
}
