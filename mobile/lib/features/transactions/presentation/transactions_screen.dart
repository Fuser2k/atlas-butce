import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/transactions_repository.dart';
import '../domain/transaction_model.dart';

final transactionsListProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(transactionsRepositoryProvider).list();
});

final transactionsSummaryProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(transactionsRepositoryProvider).summary();
});

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionsListProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(transactionsListProvider);
          await ref.read(transactionsListProvider.future);
        },
        child: transactions.when(
          data: (items) {
            if (items.isEmpty) {
              return const Center(child: Text('Henüz bir gelir/gider kaydı yok.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(),
              itemBuilder: (context, index) => _TransactionTile(
                transaction: items[index],
                onDelete: () async {
                  await ref.read(transactionsRepositoryProvider).delete(items[index].id);
                  ref.invalidate(transactionsListProvider);
                  ref.invalidate(transactionsSummaryProvider);
                },
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Hata: $error')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateSheet(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _showCreateSheet(BuildContext context, WidgetRef ref) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _CreateTransactionSheet(),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback onDelete;

  const _TransactionTile({required this.transaction, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionKind.income;
    final amountText = NumberFormat.currency(locale: 'tr_TR', symbol: '₺').format(transaction.amount);

    return ListTile(
      leading: Icon(
        isIncome ? Icons.arrow_upward : Icons.arrow_downward,
        color: isIncome ? Colors.green : Colors.red,
      ),
      title: Text(transaction.category),
      subtitle: Text(DateFormat('dd.MM.yyyy').format(transaction.date)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${isIncome ? '+' : '-'}$amountText',
            style: TextStyle(color: isIncome ? Colors.green : Colors.red, fontWeight: FontWeight.bold),
          ),
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: onDelete),
        ],
      ),
    );
  }
}

class _CreateTransactionSheet extends ConsumerStatefulWidget {
  const _CreateTransactionSheet();

  @override
  ConsumerState<_CreateTransactionSheet> createState() => _CreateTransactionSheetState();
}

class _CreateTransactionSheetState extends ConsumerState<_CreateTransactionSheet> {
  final _formKey = GlobalKey<FormState>();
  final _categoryController = TextEditingController();
  final _amountController = TextEditingController();
  TransactionKind _type = TransactionKind.expense;
  DateTime _date = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _categoryController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      await ref.read(transactionsRepositoryProvider).create(
            type: _type,
            amount: double.parse(_amountController.text.replaceAll(',', '.')),
            category: _categoryController.text.trim(),
            date: _date,
          );
      ref.invalidate(transactionsListProvider);
      ref.invalidate(transactionsSummaryProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Kayıt eklenemedi: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SegmentedButton<TransactionKind>(
              segments: const [
                ButtonSegment(value: TransactionKind.income, label: Text('Gelir')),
                ButtonSegment(value: TransactionKind.expense, label: Text('Gider')),
              ],
              selected: {_type},
              onSelectionChanged: (selection) => setState(() => _type = selection.first),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _categoryController,
              decoration: const InputDecoration(labelText: 'Kategori'),
              validator: (value) => (value == null || value.trim().isEmpty) ? 'Kategori girin' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(labelText: 'Tutar'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Tutar girin';
                final parsed = double.tryParse(value.replaceAll(',', '.'));
                if (parsed == null || parsed <= 0) return 'Geçerli bir tutar girin';
                return null;
              },
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Tarih: ${DateFormat('dd.MM.yyyy').format(_date)}'),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2100),
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
