enum RecurrencePeriod { none, weekly, monthly, yearly }

RecurrencePeriod recurrencePeriodFromJson(String? value) {
  switch (value) {
    case 'WEEKLY':
      return RecurrencePeriod.weekly;
    case 'MONTHLY':
      return RecurrencePeriod.monthly;
    case 'YEARLY':
      return RecurrencePeriod.yearly;
    default:
      return RecurrencePeriod.none;
  }
}

String recurrencePeriodToJson(RecurrencePeriod period) {
  switch (period) {
    case RecurrencePeriod.none:
      return 'NONE';
    case RecurrencePeriod.weekly:
      return 'WEEKLY';
    case RecurrencePeriod.monthly:
      return 'MONTHLY';
    case RecurrencePeriod.yearly:
      return 'YEARLY';
  }
}

const recurrencePeriodLabels = {
  RecurrencePeriod.none: 'Tek Seferlik',
  RecurrencePeriod.weekly: 'Haftalık',
  RecurrencePeriod.monthly: 'Aylık',
  RecurrencePeriod.yearly: 'Yıllık',
};

class BillModel {
  final String id;
  final String name;
  final String category;
  final double amount;
  final DateTime dueDate;
  final RecurrencePeriod recurrencePeriod;
  final bool isPaid;

  const BillModel({
    required this.id,
    required this.name,
    required this.category,
    required this.amount,
    required this.dueDate,
    required this.recurrencePeriod,
    required this.isPaid,
  });

  bool get isOverdue => !isPaid && dueDate.isBefore(DateTime.now());
  bool get isDueSoon =>
      !isPaid && !isOverdue && dueDate.isBefore(DateTime.now().add(const Duration(days: 7)));

  factory BillModel.fromJson(Map<String, dynamic> json) {
    return BillModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      amount: double.parse(json['amount'].toString()),
      dueDate: DateTime.parse(json['dueDate'] as String),
      recurrencePeriod: recurrencePeriodFromJson(json['recurrencePeriod'] as String?),
      isPaid: json['isPaid'] as bool,
    );
  }
}
