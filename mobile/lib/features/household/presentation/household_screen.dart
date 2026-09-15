import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/household_repository.dart';
import '../domain/household_member_model.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

final householdSummaryProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(householdRepositoryProvider).summary();
});

class HouseholdScreen extends ConsumerWidget {
  const HouseholdScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(householdSummaryProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(householdSummaryProvider);
          await ref.read(householdSummaryProvider.future);
        },
        child: summary.when(
          data: (data) {
            if (data.members.isEmpty) {
              return const Center(child: Text('Henüz bir hane üyesi eklenmedi.'));
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Toplam Hane Bütçesi', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('Gelir: ${_currency.format(data.totalIncome)}'),
                        Text('Gider: ${_currency.format(data.totalExpense)}'),
                        Text(
                          'Net: ${_currency.format(data.net)}',
                          style: TextStyle(fontWeight: FontWeight.bold, color: data.net >= 0 ? Colors.green : Colors.red),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                for (final member in data.members)
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.person_outline),
                      title: Text(member.name),
                      subtitle: Text(
                        'Gelir ${_currency.format(member.income)} · Gider ${_currency.format(member.expense)}',
                      ),
                      trailing: Text(
                        _currency.format(member.net),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: member.net >= 0 ? Colors.green : Colors.red,
                        ),
                      ),
                      onTap: () => _showFormSheet(context, ref, id: member.id, currentName: member.name),
                      onLongPress: () => _confirmDelete(context, ref, member),
                    ),
                  ),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Hata: $error')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showFormSheet(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, HouseholdMemberSummary member) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hane Üyesini Sil'),
        content: Text('${member.name} silinsin mi? Geçmiş işlemler silinmez, yalnızca kişi bağlantısı kaldırılır.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('İptal')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Sil')),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(householdRepositoryProvider).delete(member.id);
    ref.invalidate(householdSummaryProvider);
  }

  Future<void> _showFormSheet(BuildContext context, WidgetRef ref, {String? id, String? currentName}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _HouseholdMemberFormSheet(id: id, currentName: currentName),
    );
  }
}

class _HouseholdMemberFormSheet extends ConsumerStatefulWidget {
  final String? id;
  final String? currentName;

  const _HouseholdMemberFormSheet({this.id, this.currentName});

  @override
  ConsumerState<_HouseholdMemberFormSheet> createState() => _HouseholdMemberFormSheetState();
}

class _HouseholdMemberFormSheetState extends ConsumerState<_HouseholdMemberFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _nameController = TextEditingController(text: widget.currentName);
  bool _isSubmitting = false;

  bool get _isEditing => widget.id != null;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final repository = ref.read(householdRepositoryProvider);
      final name = _nameController.text.trim();
      if (_isEditing) {
        await repository.update(widget.id!, name);
      } else {
        await repository.create(name);
      }
      ref.invalidate(householdSummaryProvider);
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
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(_isEditing ? 'Hane Üyesini Düzenle' : 'Yeni Hane Üyesi', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Ad'),
              validator: (value) => (value == null || value.trim().isEmpty) ? 'Ad girin' : null,
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
    );
  }
}
