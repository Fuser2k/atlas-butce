import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/accounts_repository.dart';
import '../domain/account_model.dart';

final _currency = NumberFormat.currency(locale: 'tr_TR', symbol: '₺');

final accountsListProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(accountsRepositoryProvider).list();
});

class AccountsScreen extends ConsumerWidget {
  const AccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accounts = ref.watch(accountsListProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(accountsListProvider);
          await ref.read(accountsListProvider.future);
        },
        child: accounts.when(
          data: (items) {
            if (items.isEmpty) {
              return const Center(child: Text('Henüz bir finansal hesap eklenmedi.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(),
              itemBuilder: (context, index) => _AccountTile(
                account: items[index],
                onTap: () => _showFormSheet(context, existing: items[index]),
                onDelete: () async {
                  final confirmed = await _confirmDelete(context);
                  if (confirmed != true) return;
                  await ref.read(accountsRepositoryProvider).delete(items[index].id);
                  ref.invalidate(accountsListProvider);
                },
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(child: Text('Hata: $error')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showFormSheet(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<bool?> _confirmDelete(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hesabı Sil'),
        content: const Text('Bu hesabı silmek istediğinize emin misiniz?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('İptal')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Sil')),
        ],
      ),
    );
  }

  Future<void> _showFormSheet(BuildContext context, {AccountModel? existing}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _AccountFormSheet(existing: existing),
    );
  }
}

class _AccountTile extends StatelessWidget {
  final AccountModel account;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _AccountTile({required this.account, required this.onTap, required this.onDelete});

  IconData get _icon => switch (account.type) {
        AccountKind.bank => Icons.account_balance_outlined,
        AccountKind.creditCard => Icons.credit_card_outlined,
        AccountKind.loan => Icons.request_quote_outlined,
        AccountKind.overdraft => Icons.savings_outlined,
      };

  String get _primaryValue => switch (account.type) {
        AccountKind.bank => _currency.format(account.balance ?? 0),
        AccountKind.creditCard =>
          '${_currency.format(account.availableLimit ?? 0)} kullanılabilir',
        AccountKind.loan => '${_currency.format(account.remainingDebt ?? 0)} kalan borç',
        AccountKind.overdraft =>
          '${_currency.format(account.remainingOverdraftLimit ?? 0)} kalan limit',
      };

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(_icon),
      title: Text(account.name),
      subtitle: Text('${accountKindLabels[account.type]}${account.bankName != null ? ' · ${account.bankName}' : ''}'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_primaryValue, style: Theme.of(context).textTheme.bodyMedium),
          IconButton(icon: const Icon(Icons.delete_outline), onPressed: onDelete),
        ],
      ),
    );
  }
}

class _AccountFormSheet extends ConsumerStatefulWidget {
  final AccountModel? existing;

  const _AccountFormSheet({this.existing});

  @override
  ConsumerState<_AccountFormSheet> createState() => _AccountFormSheetState();
}

class _AccountFormSheetState extends ConsumerState<_AccountFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late AccountKind _type = widget.existing?.type ?? AccountKind.bank;
  late final _nameController = TextEditingController(text: widget.existing?.name);
  late final _bankNameController = TextEditingController(text: widget.existing?.bankName);
  late final _balanceController = TextEditingController(text: widget.existing?.balance?.toString());
  late final _cardLimitController = TextEditingController(text: widget.existing?.cardLimit?.toString());
  late final _currentDebtController = TextEditingController(text: widget.existing?.currentDebt?.toString());
  late final _minPaymentController = TextEditingController(text: widget.existing?.minPaymentAmount?.toString());
  late final _fullPaymentController = TextEditingController(text: widget.existing?.fullPaymentAmount?.toString());
  late final _loanAmountController = TextEditingController(text: widget.existing?.loanAmount?.toString());
  late final _monthlyInstallmentController =
      TextEditingController(text: widget.existing?.monthlyInstallment?.toString());
  late final _remainingDebtController = TextEditingController(text: widget.existing?.remainingDebt?.toString());
  late final _remainingInstallmentsController =
      TextEditingController(text: widget.existing?.remainingInstallments?.toString());
  late final _overdraftLimitController = TextEditingController(text: widget.existing?.overdraftLimit?.toString());
  late final _usedAmountController = TextEditingController(text: widget.existing?.usedAmount?.toString());
  DateTime? _statementDate;
  DateTime? _dueDate;
  bool _isSubmitting = false;

  bool get _isEditing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    _statementDate = widget.existing?.statementDate;
    _dueDate = widget.existing?.dueDate;
  }

  @override
  void dispose() {
    for (final c in [
      _nameController,
      _bankNameController,
      _balanceController,
      _cardLimitController,
      _currentDebtController,
      _minPaymentController,
      _fullPaymentController,
      _loanAmountController,
      _monthlyInstallmentController,
      _remainingDebtController,
      _remainingInstallmentsController,
      _overdraftLimitController,
      _usedAmountController,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  double? _num(TextEditingController c) => c.text.trim().isEmpty ? null : double.tryParse(c.text.replaceAll(',', '.'));
  int? _int(TextEditingController c) => c.text.trim().isEmpty ? null : int.tryParse(c.text.trim());

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    final body = <String, dynamic>{
      'type': accountKindToJson(_type),
      'name': _nameController.text.trim(),
      if (_bankNameController.text.trim().isNotEmpty) 'bankName': _bankNameController.text.trim(),
    };

    switch (_type) {
      case AccountKind.bank:
        if (_num(_balanceController) != null) body['balance'] = _num(_balanceController);
      case AccountKind.creditCard:
        if (_num(_cardLimitController) != null) body['cardLimit'] = _num(_cardLimitController);
        if (_num(_currentDebtController) != null) body['currentDebt'] = _num(_currentDebtController);
        if (_num(_minPaymentController) != null) body['minPaymentAmount'] = _num(_minPaymentController);
        if (_num(_fullPaymentController) != null) body['fullPaymentAmount'] = _num(_fullPaymentController);
        if (_statementDate != null) body['statementDate'] = _statementDate!.toUtc().toIso8601String();
        if (_dueDate != null) body['dueDate'] = _dueDate!.toUtc().toIso8601String();
      case AccountKind.loan:
        if (_num(_loanAmountController) != null) body['loanAmount'] = _num(_loanAmountController);
        if (_num(_monthlyInstallmentController) != null) {
          body['monthlyInstallment'] = _num(_monthlyInstallmentController);
        }
        if (_num(_remainingDebtController) != null) body['remainingDebt'] = _num(_remainingDebtController);
        if (_int(_remainingInstallmentsController) != null) {
          body['remainingInstallments'] = _int(_remainingInstallmentsController);
        }
        if (_dueDate != null) body['dueDate'] = _dueDate!.toUtc().toIso8601String();
      case AccountKind.overdraft:
        if (_num(_overdraftLimitController) != null) body['overdraftLimit'] = _num(_overdraftLimitController);
        if (_num(_usedAmountController) != null) body['usedAmount'] = _num(_usedAmountController);
        if (_dueDate != null) body['dueDate'] = _dueDate!.toUtc().toIso8601String();
    }

    try {
      final repository = ref.read(accountsRepositoryProvider);
      if (_isEditing) {
        await repository.update(widget.existing!.id, body);
      } else {
        await repository.create(body);
      }
      ref.invalidate(accountsListProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Kaydedilemedi: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _pickDate({required bool isStatementDate}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: (isStatementDate ? _statementDate : _dueDate) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isStatementDate) {
        _statementDate = picked;
      } else {
        _dueDate = picked;
      }
    });
  }

  String? _requiredValidator(String? value) => (value == null || value.trim().isEmpty) ? 'Bu alan zorunlu' : null;

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
              Text(_isEditing ? 'Hesabı Düzenle' : 'Yeni Hesap', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              DropdownButtonFormField<AccountKind>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Hesap Türü'),
                items: [
                  for (final kind in AccountKind.values)
                    DropdownMenuItem(value: kind, child: Text(accountKindLabels[kind]!)),
                ],
                onChanged: _isEditing ? null : (value) => setState(() => _type = value!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Hesap Adı'),
                validator: _requiredValidator,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _bankNameController,
                decoration: const InputDecoration(labelText: 'Banka (opsiyonel)'),
              ),
              const SizedBox(height: 16),
              ..._typeSpecificFields(),
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

  List<Widget> _typeSpecificFields() {
    switch (_type) {
      case AccountKind.bank:
        return [
          TextFormField(
            controller: _balanceController,
            decoration: const InputDecoration(labelText: 'Bakiye'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
        ];
      case AccountKind.creditCard:
        return [
          TextFormField(
            controller: _cardLimitController,
            decoration: const InputDecoration(labelText: 'Kart Limiti'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _isEditing ? null : _requiredValidator,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _currentDebtController,
            decoration: const InputDecoration(labelText: 'Mevcut Borç'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _minPaymentController,
            decoration: const InputDecoration(labelText: 'Asgari Ödeme Tutarı'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _fullPaymentController,
            decoration: const InputDecoration(labelText: 'Tam Ödeme Tutarı'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 16),
          _dateTile('Hesap Kesim Tarihi', _statementDate, () => _pickDate(isStatementDate: true)),
          const SizedBox(height: 8),
          _dateTile('Son Ödeme Tarihi', _dueDate, () => _pickDate(isStatementDate: false)),
        ];
      case AccountKind.loan:
        return [
          TextFormField(
            controller: _loanAmountController,
            decoration: const InputDecoration(labelText: 'Kredi Tutarı'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _isEditing ? null : _requiredValidator,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _monthlyInstallmentController,
            decoration: const InputDecoration(labelText: 'Aylık Taksit'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _remainingDebtController,
            decoration: const InputDecoration(labelText: 'Kalan Borç'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _remainingInstallmentsController,
            decoration: const InputDecoration(labelText: 'Kalan Taksit Sayısı'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 8),
          _dateTile('Sonraki Ödeme Tarihi', _dueDate, () => _pickDate(isStatementDate: false)),
        ];
      case AccountKind.overdraft:
        return [
          TextFormField(
            controller: _overdraftLimitController,
            decoration: const InputDecoration(labelText: 'KMH Limiti'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: _isEditing ? null : _requiredValidator,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _usedAmountController,
            decoration: const InputDecoration(labelText: 'Kullanılan Tutar'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
          ),
          const SizedBox(height: 8),
          _dateTile('Son Ödeme Tarihi', _dueDate, () => _pickDate(isStatementDate: false)),
        ];
    }
  }

  Widget _dateTile(String label, DateTime? value, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(value != null ? '$label: ${DateFormat('dd.MM.yyyy').format(value)}' : label),
      trailing: const Icon(Icons.calendar_today_outlined),
      onTap: onTap,
    );
  }
}
