import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/savings_repository.dart';
import '../domain/saving_goal_model.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

final savingsListProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(savingsRepositoryProvider).list();
});

Color _paceColor(PaceStatus status) {
  switch (status) {
    case PaceStatus.onTrack:
      return Colors.green;
    case PaceStatus.ahead:
      return Colors.blue;
    case PaceStatus.behind:
      return Colors.red;
    case PaceStatus.noTargetDate:
      return Colors.grey;
  }
}

class SavingsScreen extends ConsumerWidget {
  const SavingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goals = ref.watch(savingsListProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(savingsListProvider);
          await ref.read(savingsListProvider.future);
        },
        child: goals.when(
          data: (items) {
            if (items.isEmpty) {
              return const Center(child: Text('Henüz bir birikim hedefi eklenmedi.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) => _GoalCard(goal: items[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Hata: $error')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          builder: (_) => const _GoalFormSheet(),
        ),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _GoalCard extends ConsumerWidget {
  final SavingGoalModel goal;

  const _GoalCard({required this.goal});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress = (goal.progressPercentage / 100).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(goal.name, style: Theme.of(context).textTheme.titleMedium)),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (_) => _GoalFormSheet(existing: goal),
                      );
                    } else if (value == 'delete') {
                      _confirmDelete(context, ref);
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Düzenle')),
                    PopupMenuItem(value: 'delete', child: Text('Sil')),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(value: progress, minHeight: 8),
            ),
            const SizedBox(height: 8),
            Text('${_currency.format(goal.currentAmount)} / ${_currency.format(goal.targetAmount)} (%${goal.progressPercentage.toStringAsFixed(0)})'),
            Text('Kalan: ${_currency.format(goal.remainingAmount)}'),
            if (goal.targetDate != null)
              Text('Hedef Tarihi: ${DateFormat('dd.MM.yyyy').format(goal.targetDate!)} · ${goal.remainingDays} gün kaldı'),
            if (goal.requiredMonthlySaving != null && goal.requiredMonthlySaving! > 0)
              Text('Gereken aylık birikim: ${_currency.format(goal.requiredMonthlySaving!)}'),
            const SizedBox(height: 4),
            Chip(
              label: Text(paceStatusLabels[goal.paceStatus]!),
              backgroundColor: _paceColor(goal.paceStatus).withValues(alpha: 0.15),
              labelStyle: TextStyle(color: _paceColor(goal.paceStatus)),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton.icon(
                  onPressed: () => _addProgress(context, ref, positive: true),
                  icon: const Icon(Icons.add),
                  label: const Text('Birikim Ekle'),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () => _addProgress(context, ref, positive: false),
                  icon: const Icon(Icons.remove),
                  label: const Text('Azalt'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hedefi Sil'),
        content: Text('${goal.name} silinsin mi?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('İptal')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Sil')),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(savingsRepositoryProvider).delete(goal.id);
    ref.invalidate(savingsListProvider);
  }

  Future<void> _addProgress(BuildContext context, WidgetRef ref, {required bool positive}) async {
    final controller = TextEditingController();
    final amount = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(positive ? 'Birikim Ekle' : 'Birikimi Azalt'),
        content: TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(labelText: 'Tutar'),
          autofocus: true,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('İptal')),
          FilledButton(
            onPressed: () {
              final value = double.tryParse(controller.text.replaceAll(',', '.'));
              Navigator.of(context).pop(value);
            },
            child: const Text('Onayla'),
          ),
        ],
      ),
    );
    if (amount == null || amount <= 0) return;
    await ref.read(savingsRepositoryProvider).addProgress(goal.id, positive ? amount : -amount);
    ref.invalidate(savingsListProvider);
  }
}

class _GoalFormSheet extends ConsumerStatefulWidget {
  final SavingGoalModel? existing;

  const _GoalFormSheet({this.existing});

  @override
  ConsumerState<_GoalFormSheet> createState() => _GoalFormSheetState();
}

class _GoalFormSheetState extends ConsumerState<_GoalFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.existing?.name);
  late final _targetAmountController = TextEditingController(text: widget.existing?.targetAmount.toString());
  late final _monthlyPlanController = TextEditingController(text: widget.existing?.monthlyPlanAmount?.toString());
  DateTime? _targetDate;
  bool _isSubmitting = false;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    _targetDate = widget.existing?.targetDate;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _targetAmountController.dispose();
    _monthlyPlanController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final repository = ref.read(savingsRepositoryProvider);
      final name = _nameController.text.trim();
      final targetAmount = double.parse(_targetAmountController.text.replaceAll(',', '.'));
      final monthlyPlan = _monthlyPlanController.text.trim().isEmpty
          ? null
          : double.tryParse(_monthlyPlanController.text.replaceAll(',', '.'));

      if (_isEditing) {
        await repository.update(
          widget.existing!.id,
          name: name,
          targetAmount: targetAmount,
          targetDate: _targetDate,
          monthlyPlanAmount: monthlyPlan,
        );
      } else {
        await repository.create(
          name: name,
          targetAmount: targetAmount,
          targetDate: _targetDate,
          monthlyPlanAmount: monthlyPlan,
        );
      }
      ref.invalidate(savingsListProvider);
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
              Text(_isEditing ? 'Hedefi Düzenle' : 'Yeni Hedef', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Hedef Adı'),
                validator: (value) => (value == null || value.trim().isEmpty) ? 'Ad girin' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _targetAmountController,
                decoration: const InputDecoration(labelText: 'Hedef Tutar'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                  if (parsed == null || parsed <= 0) return 'Geçerli bir tutar girin';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _monthlyPlanController,
                decoration: const InputDecoration(labelText: 'Aylık Planlanan Birikim (opsiyonel)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(_targetDate != null
                    ? 'Hedef Tarihi: ${DateFormat('dd.MM.yyyy').format(_targetDate!)}'
                    : 'Hedef Tarihi (opsiyonel)'),
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _targetDate ?? DateTime.now().add(const Duration(days: 30)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime(2100),
                  );
                  if (picked != null) setState(() => _targetDate = picked);
                },
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
