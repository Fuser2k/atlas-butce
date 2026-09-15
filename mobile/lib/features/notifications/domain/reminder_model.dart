class ReminderModel {
  final String id;
  final String sourceType;
  final String title;
  final String body;
  final DateTime scheduledAt;
  final DateTime? readAt;

  const ReminderModel({
    required this.id,
    required this.sourceType,
    required this.title,
    required this.body,
    required this.scheduledAt,
    this.readAt,
  });

  bool get isRead => readAt != null;

  factory ReminderModel.fromJson(Map<String, dynamic> json) {
    return ReminderModel(
      id: json['id'] as String,
      sourceType: json['sourceType'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      readAt: json['readAt'] == null ? null : DateTime.parse(json['readAt'] as String),
    );
  }
}
