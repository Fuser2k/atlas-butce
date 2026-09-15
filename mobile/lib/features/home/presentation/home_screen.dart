import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../accounts/presentation/accounts_screen.dart';
import '../../bills/presentation/bills_screen.dart';
import '../../transactions/presentation/transactions_screen.dart';
import '../domain/dashboard_calculations.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsSummary = ref.watch(transactionsSummaryProvider);
    final accountsSummary = ref.watch(accountsSummaryProvider);
    final accountsList = ref.watch(accountsListProvider);
    final upcomingBills = ref.watch(billsUpcomingProvider);

    final isLoading = transactionsSummary.isLoading ||
        accountsSummary.isLoading ||
        accountsList.isLoading ||
        upcomingBills.isLoading;
    final hasError = transactionsSummary.hasError ||
        accountsSummary.hasError ||
        accountsList.hasError ||
        upcomingBills.hasError;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(transactionsSummaryProvider);
        ref.invalidate(accountsSummaryProvider);
        ref.invalidate(accountsListProvider);
        ref.invalidate(billsUpcomingProvider);
        await Future.wait([
          ref.read(transactionsSummaryProvider.future),
          ref.read(accountsSummaryProvider.future),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isLoading) const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            ) else if (hasError)
              Text('Bazı özet veriler yüklenemedi: ${transactionsSummary.error ?? accountsSummary.error ?? accountsList.error ?? upcomingBills.error}')
            else ...[
              Text('Gelir / Gider', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Gelir',
                      value: _currency.format(transactionsSummary.requireValue.totalIncome),
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Gider',
                      value: _currency.format(transactionsSummary.requireValue.totalExpense),
                      color: Colors.red,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _SummaryCard(
                label: 'Mevcut Para (gelir - gider)',
                value: _currency.format(transactionsSummary.requireValue.availableBalance),
                color: Theme.of(context).colorScheme.primary,
                fullWidth: true,
              ),
              const SizedBox(height: 24),
              Text('Hesaplar', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Banka Bakiyesi',
                      value: _currency.format(accountsSummary.requireValue.totalBankBalance),
                      color: Colors.green,
                      onTap: () => context.go('/accounts'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Kart Borcu',
                      value: _currency.format(accountsSummary.requireValue.totalCreditCardDebt),
                      color: Colors.red,
                      onTap: () => context.go('/accounts'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _SummaryCard(
                      label: 'Toplam Kredi Borcu',
                      value: _currency.format(accountsSummary.requireValue.totalLoanRemainingDebt),
                      color: Colors.red,
                      onTap: () => context.go('/accounts'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SummaryCard(
                      label: 'KMH Kullanılan Tutar',
                      value: _currency.format(accountsSummary.requireValue.totalOverdraftUsed),
                      color: Colors.orange,
                      onTap: () => context.go('/accounts'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Builder(builder: (context) {
                final availableMoney = calculateAvailableMoney(
                  totalBankBalance: accountsSummary.requireValue.totalBankBalance,
                  upcomingBillsTotal: upcomingBills.requireValue.fold(0.0, (sum, b) => sum + b.amount),
                  upcomingLoanInstallmentsTotal: sumUpcomingLoanInstallments(accountsList.requireValue),
                  upcomingCreditCardMinPaymentTotal: sumUpcomingCreditCardMinPayments(accountsList.requireValue),
                );
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SummaryCard(
                      label: 'Kullanılabilir Para (30 gün içindeki zorunlu ödemeler düşülmüş)',
                      value: _currency.format(availableMoney),
                      color: availableMoney >= 0 ? Theme.of(context).colorScheme.primary : Colors.red,
                      fullWidth: true,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Banka bakiyesi − (yaklaşan faturalar + kredi taksitleri + kart asgari ödemeleri)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                );
              }),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Yaklaşan Ödemeler', style: Theme.of(context).textTheme.titleMedium),
                  TextButton(onPressed: () => context.go('/bills'), child: const Text('Tümünü Gör')),
                ],
              ),
              const SizedBox(height: 8),
              if (upcomingBills.requireValue.isEmpty)
                const Text('Önümüzdeki 30 gün içinde yaklaşan bir ödeme yok.')
              else
                ...upcomingBills.requireValue.take(3).map(
                      (bill) => Card(
                        child: ListTile(
                          title: Text(bill.name),
                          subtitle: Text('${bill.category} · ${DateFormat('dd.MM.yyyy').format(bill.dueDate)}'),
                          trailing: Text(_currency.format(bill.amount)),
                          onTap: () => context.go('/bills'),
                        ),
                      ),
                    ),
            ],
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
  final VoidCallback? onTap;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.color,
    this.fullWidth = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
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
      ),
    );
  }
}
