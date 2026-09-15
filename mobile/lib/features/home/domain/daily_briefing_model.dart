class BriefingItem {
  final String type;
  final String text;
  final String priority;

  const BriefingItem({required this.type, required this.text, required this.priority});

  bool get isWarning => priority == 'WARNING';

  factory BriefingItem.fromJson(Map<String, dynamic> json) {
    return BriefingItem(
      type: json['type'] as String,
      text: json['text'] as String,
      priority: json['priority'] as String,
    );
  }
}

class DailyBriefing {
  final DateTime generatedAt;
  final String headline;
  final List<BriefingItem> items;

  const DailyBriefing({required this.generatedAt, required this.headline, required this.items});

  factory DailyBriefing.fromJson(Map<String, dynamic> json) {
    return DailyBriefing(
      generatedAt: DateTime.parse(json['generatedAt'] as String),
      headline: json['headline'] as String,
      items: (json['items'] as List<dynamic>).map((e) => BriefingItem.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
