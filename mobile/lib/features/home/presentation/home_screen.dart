import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../accounts/presentation/accounts_screen.dart';
import '../../bills/presentation/bills_screen.dart';
import '../../household/presentation/household_screen.dart';
import '../../savings/presentation/savings_screen.dart';
import '../../transactions/data/transactions_repository.dart';
import '../../transactions/domain/transaction_model.dart';
import '../../transactions/presentation/transactions_screen.dart';
import '../data/dashboard_repository.dart';
import '../domain/dashboard_calculations.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

final incomeDistributionProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(transactionsRepositoryProvider).distribution(TransactionKind.income);
});

final expenseDistributionProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(transactionsRepositoryProvider).distribution(TransactionKind.expense);
});

final monthlyPaymentPlanProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(dashboardRepositoryProvider).monthlyPaymentPlan();
});

final dailyBriefingProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(dashboardRepositoryProvider).dailyBriefing();
});

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
              const SizedBox(height: 24),
              _DailyBriefingCard(),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(child: _DistributionCard(title: 'Gelir Dağılımı', isIncome: true)),
                  const SizedBox(width: 12),
                  Expanded(child: _DistributionCard(title: 'Gider Dağılımı', isIncome: false)),
                ],
              ),
              const SizedBox(height: 24),
              _MonthlyPaymentPlanCard(),
              const SizedBox(height: 24),
              _HouseholdSummaryCard(),
              const SizedBox(height: 12),
              _SavingsSummaryCard(),
              const SizedBox(height: 12),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.gavel_outlined),
                  title: const Text('Kamu Borç Takip'),
                  subtitle: const Text('Hazırlık ekranı — yakında entegre edilecek'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.go('/public-debt'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DailyBriefingCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final briefing = ref.watch(dailyBriefingProvider);
    return briefing.when(
      data: (data) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome_outlined, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Günlük ATLAS Brifingi', style: Theme.of(context).textTheme.titleMedium),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(data.headline, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              for (final item in data.items)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        item.isWarning ? Icons.warning_amber_outlined : Icons.info_outline,
                        size: 16,
                        color: item.isWarning ? Colors.orange : Colors.grey,
                      ),
                      const SizedBox(width: 6),
                      Expanded(child: Text(item.text, style: Theme.of(context).textTheme.bodySmall)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
      loading: () => const SizedBox(height: 80, child: Center(child: CircularProgressIndicator())),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _DistributionCard extends ConsumerWidget {
  final String title;
  final bool isIncome;

  const _DistributionCard({required this.title, required this.isIncome});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final distribution = ref.watch(isIncome ? incomeDistributionProvider : expenseDistributionProvider);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            distribution.when(
              data: (data) {
                if (data.items.isEmpty) {
                  return const Text('Bu ay veri yok.', style: TextStyle(fontSize: 12));
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final item in data.items.take(3))
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text('${item.category}: %${item.percentage.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12)),
                      ),
                  ],
                );
              },
              loading: () => const SizedBox(height: 20, child: LinearProgressIndicator()),
              error: (_, _) => const Text('Yüklenemedi', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}

class _MonthlyPaymentPlanCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plan = ref.watch(monthlyPaymentPlanProvider);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Aylık Ödeme Planı', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            plan.when(
              data: (data) {
                if (data.items.isEmpty) {
                  return const Text('Önümüzdeki ay için planlı bir ödeme yok.', style: TextStyle(fontSize: 12));
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final item in data.items.take(5))
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Text(
                          '${DateFormat('dd.MM').format(item.date)} — ${item.title}: ${_currency.format(item.amount)}',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text('Toplam: ${_currency.format(data.totalAmount)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                );
              },
              loading: () => const SizedBox(height: 20, child: LinearProgressIndicator()),
              error: (_, _) => const Text('Yüklenemedi', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      ),
    );
  }
}

class _HouseholdSummaryCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(householdSummaryProvider);
    return summary.when(
      data: (data) {
        if (data.members.isEmpty) return const SizedBox.shrink();
        return Card(
          child: ListTile(
            leading: const Icon(Icons.groups_outlined),
            title: const Text('Hane Halkı Özeti'),
            subtitle: Text('Net: ${_currency.format(data.net)} · ${data.members.length} kişi'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/household'),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _SavingsSummaryCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goals = ref.watch(savingsListProvider);
    return goals.when(
      data: (items) {
        if (items.isEmpty) return const SizedBox.shrink();
        final goal = items.first;
        return Card(
          child: ListTile(
            leading: const Icon(Icons.savings_outlined),
            title: Text(goal.name),
            subtitle: Text('%${goal.progressPercentage.toStringAsFixed(0)} — ${_currency.format(goal.currentAmount)} / ${_currency.format(goal.targetAmount)}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/savings'),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
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
