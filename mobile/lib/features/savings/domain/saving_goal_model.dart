double _num(dynamic value) => value == null ? 0 : double.parse(value.toString());
DateTime? _date(dynamic value) => value == null ? null : DateTime.parse(value.toString());

enum PaceStatus { onTrack, behind, ahead, noTargetDate }

PaceStatus paceStatusFromJson(String value) {
  switch (value) {
    case 'ON_TRACK':
      return PaceStatus.onTrack;
    case 'BEHIND':
      return PaceStatus.behind;
    case 'AHEAD':
      return PaceStatus.ahead;
    default:
      return PaceStatus.noTargetDate;
  }
}

const paceStatusLabels = {
  PaceStatus.onTrack: 'Hedefe uygun ilerliyorsunuz',
  PaceStatus.behind: 'Planın gerisinde',
  PaceStatus.ahead: 'Planın önünde',
  PaceStatus.noTargetDate: 'Hedef tarihi belirtilmedi',
};

class SavingGoalModel {
  final String id;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final DateTime? targetDate;
  final double? monthlyPlanAmount;
  final double remainingAmount;
  final double progressPercentage;
  final int? remainingDays;
  final double? requiredMonthlySaving;
  final PaceStatus paceStatus;

  const SavingGoalModel({
    required this.id,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    this.targetDate,
    this.monthlyPlanAmount,
    required this.remainingAmount,
    required this.progressPercentage,
    this.remainingDays,
    this.requiredMonthlySaving,
    required this.paceStatus,
  });

  factory SavingGoalModel.fromJson(Map<String, dynamic> json) {
    return SavingGoalModel(
      id: json['id'] as String,
      name: json['name'] as String,
      targetAmount: _num(json['targetAmount']),
      currentAmount: _num(json['currentAmount']),
      targetDate: _date(json['targetDate']),
      monthlyPlanAmount: json['monthlyPlanAmount'] == null ? null : _num(json['monthlyPlanAmount']),
      remainingAmount: _num(json['remainingAmount']),
      progressPercentage: _num(json['progressPercentage']),
      remainingDays: json['remainingDays'] as int?,
      requiredMonthlySaving: json['requiredMonthlySaving'] == null ? null : _num(json['requiredMonthlySaving']),
      paceStatus: paceStatusFromJson(json['paceStatus'] as String),
    );
  }
}
