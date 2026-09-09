import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../transactions/presentation/transactions_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(transactionsSummaryProvider);
    final currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(transactionsSummaryProvider);
        await ref.read(transactionsSummaryProvider.future);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Finansal Özet', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            summary.when(
              data: (data) => Row(
                children: [
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Gelir',
                      value: currency.format(data.totalIncome),
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Gider',
                      value: currency.format(data.totalExpense),
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => Text('Özet yüklenemedi: $error'),
            ),
            const SizedBox(height: 12),
            summary.maybeWhen(
              data: (data) => _SummaryCard(
                label: 'Mevcut Para',
                value: currency.format(data.availableBalance),
                color: Theme.of(context).colorScheme.primary,
                fullWidth: true,
              ),
              orElse: () => const SizedBox.shrink(),
            ),
            const SizedBox(height: 8),
            Text(
              'Banka/kart/kredi hesapları ve fatura bilgileri Hafta 3-4 kapsamında eklenince bu özet güncellenecek.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool fullWidth;

  const _SummaryCard({required this.label, required this.value, required this.color, this.fullWidth = false});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
