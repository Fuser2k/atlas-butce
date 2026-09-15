class MonthlyPaymentPlanItem {
  final DateTime date;
  final String type;
  final String title;
  final double amount;

  const MonthlyPaymentPlanItem({
    required this.date,
    required this.type,
    required this.title,
    required this.amount,
  });

  factory MonthlyPaymentPlanItem.fromJson(Map<String, dynamic> json) {
    return MonthlyPaymentPlanItem(
      date: DateTime.parse(json['date'] as String),
      type: json['type'] as String,
      title: json['title'] as String,
      amount: double.parse(json['amount'].toString()),
    );
  }
}

class MonthlyPaymentPlan {
  final double totalAmount;
  final List<MonthlyPaymentPlanItem> items;

  const MonthlyPaymentPlan({required this.totalAmount, required this.items});

  factory MonthlyPaymentPlan.fromJson(Map<String, dynamic> json) {
    return MonthlyPaymentPlan(
      totalAmount: double.parse(json['totalAmount'].toString()),
      items: (json['items'] as List<dynamic>)
          .map((e) => MonthlyPaymentPlanItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
