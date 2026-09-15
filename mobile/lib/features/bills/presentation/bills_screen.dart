import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:intl/intl.dart';

import '../data/bills_repository.dart';
import '../domain/bill_model.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');
const _categorySuggestions = ['Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon', 'Kira', 'Aidat', 'Sigorta', 'Abonelik', 'Diğer'];

enum BillFilter { all, upcoming }

final billFilterProvider = StateProvider<BillFilter>((ref) => BillFilter.upcoming);

final billsListProvider = FutureProvider.autoDispose((ref) {
  final filter = ref.watch(billFilterProvider);
  final repository = ref.watch(billsRepositoryProvider);
  return filter == BillFilter.upcoming ? repository.upcoming() : repository.list();
});

class BillsScreen extends ConsumerWidget {
  const BillsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bills = ref.watch(billsListProvider);
    final filter = ref.watch(billFilterProvider);

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SegmentedButton<BillFilter>(
              segments: const [
                ButtonSegment(value: BillFilter.upcoming, label: Text('Yaklaşan (30 gün)')),
                ButtonSegment(value: BillFilter.all, label: Text('Tümü')),
              ],
              selected: {filter},
              onSelectionChanged: (selection) => ref.read(billFilterProvider.notifier).state = selection.first,
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(billsListProvider);
                await ref.read(billsListProvider.future);
              },
              child: bills.when(
                data: (items) {
                  if (items.isEmpty) {
                    return const Center(child: Text('Bu görünümde bir fatura/ödeme yok.'));
                  }
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, _) => const Divider(),
                    itemBuilder: (context, index) => _BillTile(
                      bill: items[index],
                      onTap: () => _showFormSheet(context, existing: items[index]),
                      onTogglePaid: () async {
                        await ref.read(billsRepositoryProvider).updateStatus(items[index].id, !items[index].isPaid);
                        ref.invalidate(billsListProvider);
                      },
                      onDelete: () async {
                        await ref.read(billsRepositoryProvider).delete(items[index].id);
                        ref.invalidate(billsListProvider);
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

  Future<void> _showFormSheet(BuildContext context, {BillModel? existing}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _BillFormSheet(existing: existing),
    );
  }
}

class _BillTile extends StatelessWidget {
  final BillModel bill;
  final VoidCallback onTap;
  final VoidCallback onTogglePaid;
  final VoidCallback onDelete;

  const _BillTile({required this.bill, required this.onTap, required this.onTogglePaid, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final Color? statusColor = bill.isOverdue
        ? Colors.red
        : bill.isDueSoon
            ? Colors.orange
            : null;

    return ListTile(
      onTap: onTap,
      leading: Checkbox(value: bill.isPaid, onChanged: (_) => onTogglePaid()),
      title: Text(bill.name),
      subtitle: Text(
        '${bill.category} · ${DateFormat('dd.MM.yyyy').format(bill.dueDate)}'
        '${bill.recurrencePeriod != RecurrencePeriod.none ? ' · ${recurrencePeriodLabels[bill.recurrencePeriod]}' : ''}'
        '${bill.isOverdue ? ' · Gecikmiş' : bill.isDueSoon ? ' · Yaklaşıyor' : ''}',
        style: statusColor != null ? TextStyle(color: statusColor, fontWeight: FontWeight.w600) : null,
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_currency.format(bill.amount)),
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: onDelete),
        ],
      ),
    );
  }
}

class _BillFormSheet extends ConsumerStatefulWidget {
  final BillModel? existing;

  const _BillFormSheet({this.existing});

  @override
  ConsumerState<_BillFormSheet> createState() => _BillFormSheetState();
}

class _BillFormSheetState extends ConsumerState<_BillFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.existing?.name);
  late final _categoryController = TextEditingController(text: widget.existing?.category);
  late final _amountController = TextEditingController(text: widget.existing?.amount.toString());
  late DateTime _dueDate = widget.existing?.dueDate ?? DateTime.now();
  late RecurrencePeriod _recurrencePeriod = widget.existing?.recurrencePeriod ?? RecurrencePeriod.none;
  bool _isSubmitting = false;

  bool get _isEditing => widget.existing != null;

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final repository = ref.read(billsRepositoryProvider);
      final name = _nameController.text.trim();
      final category = _categoryController.text.trim();
      final amount = double.parse(_amountController.text.replaceAll(',', '.'));

      if (_isEditing) {
        await repository.update(
          widget.existing!.id,
          name: name,
          category: category,
          amount: amount,
          dueDate: _dueDate,
          recurrencePeriod: _recurrencePeriod,
        );
      } else {
        await repository.create(
          name: name,
          category: category,
          amount: amount,
          dueDate: _dueDate,
          recurrencePeriod: _recurrencePeriod,
        );
      }

      ref.invalidate(billsListProvider);
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
              Text(_isEditing ? 'Faturayı Düzenle' : 'Yeni Fatura/Sabit Ödeme',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Ad'),
                validator: (value) => (value == null || value.trim().isEmpty) ? 'Ad girin' : null,
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
                title: Text('Vade Tarihi: ${DateFormat('dd.MM.yyyy').format(_dueDate)}'),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _dueDate,
                    firstDate: DateTime(2020),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) setState(() => _dueDate = picked);
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<RecurrencePeriod>(
                initialValue: _recurrencePeriod,
                decoration: const InputDecoration(labelText: 'Tekrarlama'),
                items: [
                  for (final period in RecurrencePeriod.values)
                    DropdownMenuItem(value: period, child: Text(recurrencePeriodLabels[period]!)),
                ],
                onChanged: (value) => setState(() => _recurrencePeriod = value!),
              ),
              const SizedBox(height: 16),
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
