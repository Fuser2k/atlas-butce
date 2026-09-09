enum TransactionKind { income, expense }

class TransactionModel {
  final String id;
  final TransactionKind type;
  final double amount;
  final String category;
  final String? subCategory;
  final String? description;
  final DateTime date;

  const TransactionModel({
    required this.id,
    required this.type,
    required this.amount,
    required this.category,
    this.subCategory,
    this.description,
    required this.date,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      type: (json['type'] as String) == 'INCOME' ? TransactionKind.income : TransactionKind.expense,
      amount: double.parse(json['amount'].toString()),
      category: json['category'] as String,
      subCategory: json['subCategory'] as String?,
      description: json['description'] as String?,
      date: DateTime.parse(json['date'] as String),
    );
  }
}

class TransactionSummary {
  final double totalIncome;
  final double totalExpense;
  final double availableBalance;

  const TransactionSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.availableBalance,
  });

  factory TransactionSummary.fromJson(Map<String, dynamic> json) {
    return TransactionSummary(
      totalIncome: double.parse(json['totalIncome'].toString()),
      totalExpense: double.parse(json['totalExpense'].toString()),
      availableBalance: double.parse(json['availableBalance'].toString()),
    );
  }
}
