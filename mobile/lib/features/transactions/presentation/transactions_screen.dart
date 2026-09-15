import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:intl/intl.dart';

import '../../household/data/household_repository.dart';
import '../data/transactions_repository.dart';
import '../domain/transaction_model.dart';

const _categorySuggestions = ['Maaş', 'Kira', 'Market', 'Fatura', 'Ulaşım', 'Sağlık', 'Eğlence', 'Diğer'];

enum TransactionPeriod { today, thisWeek, thisMonth, all }

final selectedPeriodProvider = StateProvider<TransactionPeriod>((ref) => TransactionPeriod.all);

(DateTime?, DateTime?) _periodRange(TransactionPeriod period) {
  final now = DateTime.now();
  final startOfToday = DateTime(now.year, now.month, now.day);
  switch (period) {
    case TransactionPeriod.today:
      return (startOfToday, null);
    case TransactionPeriod.thisWeek:
      return (startOfToday.subtract(Duration(days: now.weekday - 1)), null);
    case TransactionPeriod.thisMonth:
      return (DateTime(now.year, now.month, 1), null);
    case TransactionPeriod.all:
      return (null, null);
  }
}

final transactionsListProvider = FutureProvider.autoDispose((ref) {
  final period = ref.watch(selectedPeriodProvider);
  final (from, to) = _periodRange(period);
  return ref.watch(transactionsRepositoryProvider).list(from: from, to: to);
});

final transactionsSummaryProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(transactionsRepositoryProvider).summary();
});

final householdMembersOptionsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(householdRepositoryProvider).list();
});

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionsListProvider);
    final selectedPeriod = ref.watch(selectedPeriodProvider);

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SegmentedButton<TransactionPeriod>(
                segments: const [
                  ButtonSegment(value: TransactionPeriod.today, label: Text('Bugün')),
                  ButtonSegment(value: TransactionPeriod.thisWeek, label: Text('Bu Hafta')),
                  ButtonSegment(value: TransactionPeriod.thisMonth, label: Text('Bu Ay')),
                  ButtonSegment(value: TransactionPeriod.all, label: Text('Tümü')),
                ],
                selected: {selectedPeriod},
                onSelectionChanged: (selection) =>
                    ref.read(selectedPeriodProvider.notifier).state = selection.first,
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(transactionsListProvider);
                await ref.read(transactionsListProvider.future);
              },
              child: transactions.when(
                data: (items) {
                  if (items.isEmpty) {
                    return const Center(child: Text('Bu dönemde bir gelir/gider kaydı yok.'));
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const Divider(),
                    itemBuilder: (context, index) => _TransactionTile(
                      transaction: items[index],
                      onTap: () => _showFormSheet(context, existing: items[index]),
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
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showFormSheet(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _showFormSheet(BuildContext context, {TransactionModel? existing}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _TransactionFormSheet(existing: existing),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _TransactionTile({required this.transaction, required this.onTap, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionKind.income;
    final amountText = NumberFormat.currency(locale: 'tr_TR', symbol: '₺').format(transaction.amount);

    return ListTile(
      onTap: onTap,
      leading: Icon(
        isIncome ? Icons.arrow_upward : Icons.arrow_downward,
        color: isIncome ? Colors.green : Colors.red,
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              transaction.subCategory != null ? '${transaction.category} · ${transaction.subCategory}' : transaction.category,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (transaction.isRecurring) ...[
            const SizedBox(width: 6),
            Icon(Icons.repeat, size: 16, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 2),
            Text(
              transaction.recurrenceInterval == RecurrenceInterval.weekly ? 'Haftalık' : 'Aylık',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).colorScheme.primary),
            ),
          ],
        ],
      ),
      subtitle: Text(
        transaction.description?.isNotEmpty == true
            ? '${DateFormat('dd.MM.yyyy').format(transaction.date)} — ${transaction.description}'
            : DateFormat('dd.MM.yyyy').format(transaction.date),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
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

class _TransactionFormSheet extends ConsumerStatefulWidget {
  final TransactionModel? existing;

  const _TransactionFormSheet({this.existing});

  @override
  ConsumerState<_TransactionFormSheet> createState() => _TransactionFormSheetState();
}

class _TransactionFormSheetState extends ConsumerState<_TransactionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _categoryController = TextEditingController(text: widget.existing?.category);
  late final _subCategoryController = TextEditingController(text: widget.existing?.subCategory);
  late final _amountController = TextEditingController(text: widget.existing?.amount.toString());
  late final _descriptionController = TextEditingController(text: widget.existing?.description);
  late TransactionKind _type = widget.existing?.type ?? TransactionKind.expense;
  late DateTime _date = widget.existing?.date ?? DateTime.now();
  late RecurrenceInterval? _recurrenceInterval = widget.existing?.recurrenceInterval;
  late String? _householdMemberId = widget.existing?.householdMemberId;
  bool _isSubmitting = false;

  bool get _isEditing => widget.existing != null;

  @override
  void dispose() {
    _categoryController.dispose();
    _subCategoryController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final repository = ref.read(transactionsRepositoryProvider);
      final amount = double.parse(_amountController.text.replaceAll(',', '.'));
      final category = _categoryController.text.trim();
      final subCategory = _subCategoryController.text.trim();
      final description = _descriptionController.text.trim();

      if (_isEditing) {
        await repository.update(
          widget.existing!.id,
          type: _type,
          amount: amount,
          category: category,
          subCategory: subCategory,
          description: description,
          date: _date,
          recurrenceInterval: _recurrenceInterval,
          householdMemberId: _householdMemberId,
        );
      } else {
        await repository.create(
          type: _type,
          amount: amount,
          category: category,
          subCategory: subCategory,
          description: description,
          date: _date,
          recurrenceInterval: _recurrenceInterval,
          householdMemberId: _householdMemberId,
        );
      }

      ref.invalidate(transactionsListProvider);
      ref.invalidate(transactionsSummaryProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Kaydedilemedi: $e')));
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
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_isEditing ? 'İşlemi Düzenle' : 'Yeni İşlem', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
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
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  for (final suggestion in _categorySuggestions)
                    ActionChip(
                      label: Text(suggestion),
                      onPressed: () => setState(() => _categoryController.text = suggestion),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _subCategoryController,
                decoration: const InputDecoration(labelText: 'Alt Kategori (opsiyonel)'),
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
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Açıklama (opsiyonel)'),
                maxLines: 2,
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
              DropdownButtonFormField<RecurrenceInterval?>(
                initialValue: _recurrenceInterval,
                decoration: const InputDecoration(labelText: 'Tekrarlama'),
                items: const [
                  DropdownMenuItem(value: null, child: Text('Yok (tek seferlik)')),
                  DropdownMenuItem(value: RecurrenceInterval.weekly, child: Text('Haftalık')),
                  DropdownMenuItem(value: RecurrenceInterval.monthly, child: Text('Aylık')),
                ],
                onChanged: (value) => setState(() => _recurrenceInterval = value),
              ),
              const SizedBox(height: 16),
              Consumer(
                builder: (context, ref, _) {
                  final members = ref.watch(householdMembersOptionsProvider);
                  return members.when(
                    data: (items) {
                      if (items.isEmpty) return const SizedBox.shrink();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: DropdownButtonFormField<String?>(
                          initialValue: _householdMemberId,
                          decoration: const InputDecoration(labelText: 'Hane Üyesi (opsiyonel)'),
                          items: [
                            const DropdownMenuItem(value: null, child: Text('Seçilmedi')),
                            for (final member in items)
                              DropdownMenuItem(value: member.id, child: Text(member.name)),
                          ],
                          onChanged: (value) => setState(() => _householdMemberId = value),
                        ),
                      );
                    },
                    loading: () => const SizedBox.shrink(),
                    error: (_, _) => const SizedBox.shrink(),
                  );
                },
              ),
              FilledButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(_isEditing ? 'Güncelle' : 'Kaydet'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
