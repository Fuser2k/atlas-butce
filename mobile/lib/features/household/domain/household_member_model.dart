double _num(dynamic value) => value == null ? 0 : double.parse(value.toString());

class HouseholdMemberModel {
  final String id;
  final String name;

  const HouseholdMemberModel({required this.id, required this.name});

  factory HouseholdMemberModel.fromJson(Map<String, dynamic> json) {
    return HouseholdMemberModel(id: json['id'] as String, name: json['name'] as String);
  }
}

class HouseholdMemberSummary {
  final String id;
  final String name;
  final double income;
  final double expense;
  final double net;

  const HouseholdMemberSummary({
    required this.id,
    required this.name,
    required this.income,
    required this.expense,
    required this.net,
  });

  factory HouseholdMemberSummary.fromJson(Map<String, dynamic> json) {
    return HouseholdMemberSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      income: _num(json['income']),
      expense: _num(json['expense']),
      net: _num(json['net']),
    );
  }
}

class HouseholdSummary {
  final double totalIncome;
  final double totalExpense;
  final double net;
  final List<HouseholdMemberSummary> members;

  const HouseholdSummary({
    required this.totalIncome,
    required this.totalExpense,
    required this.net,
    required this.members,
  });

  factory HouseholdSummary.fromJson(Map<String, dynamic> json) {
    return HouseholdSummary(
      totalIncome: _num(json['totalIncome']),
      totalExpense: _num(json['totalExpense']),
      net: _num(json['net']),
      members: (json['members'] as List<dynamic>)
          .map((e) => HouseholdMemberSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
