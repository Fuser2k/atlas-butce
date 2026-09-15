enum TransactionKind { income, expense }

enum RecurrenceInterval { weekly, monthly }

class TransactionModel {
  final String id;
  final TransactionKind type;
  final double amount;
  final String category;
  final String? subCategory;
  final String? description;
  final DateTime date;
  final RecurrenceInterval? recurrenceInterval;
  final String? householdMemberId;

  const TransactionModel({
    required this.id,
    required this.type,
    required this.amount,
    required this.category,
    this.subCategory,
    this.description,
    required this.date,
    this.recurrenceInterval,
    this.householdMemberId,
  });

  bool get isRecurring => recurrenceInterval != null;

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      type: (json['type'] as String) == 'INCOME' ? TransactionKind.income : TransactionKind.expense,
      amount: double.parse(json['amount'].toString()),
      category: json['category'] as String,
      subCategory: json['subCategory'] as String?,
      description: json['description'] as String?,
      date: DateTime.parse(json['date'] as String),
      recurrenceInterval: switch (json['recurrenceInterval'] as String?) {
        'WEEKLY' => RecurrenceInterval.weekly,
        'MONTHLY' => RecurrenceInterval.monthly,
        _ => null,
      },
      householdMemberId: json['householdMemberId'] as String?,
    );
  }
}

class CategoryDistributionItem {
  final String category;
  final double amount;
  final double percentage;

  const CategoryDistributionItem({required this.category, required this.amount, required this.percentage});

  factory CategoryDistributionItem.fromJson(Map<String, dynamic> json) {
    return CategoryDistributionItem(
      category: json['category'] as String,
      amount: double.parse(json['amount'].toString()),
      percentage: double.parse(json['percentage'].toString()),
    );
  }
}

class CategoryDistribution {
  final double total;
  final List<CategoryDistributionItem> items;

  const CategoryDistribution({required this.total, required this.items});

  factory CategoryDistribution.fromJson(Map<String, dynamic> json) {
    return CategoryDistribution(
      total: double.parse(json['total'].toString()),
      items: (json['items'] as List<dynamic>)
          .map((e) => CategoryDistributionItem.fromJson(e as Map<String, dynamic>))
          .toList(),
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
