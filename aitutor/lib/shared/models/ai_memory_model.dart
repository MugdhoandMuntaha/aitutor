class AIMemoryModel {
  final String id;
  final String content;
  final String category; // 'preference', 'academic_goal', 'fact', 'general'
  final bool isEnabled;
  final DateTime createdAt;

  AIMemoryModel({
    required this.id,
    required this.content,
    this.category = 'preference',
    this.isEnabled = true,
    required this.createdAt,
  });

  AIMemoryModel copyWith({
    String? id,
    String? content,
    String? category,
    bool? isEnabled,
    DateTime? createdAt,
  }) {
    return AIMemoryModel(
      id: id ?? this.id,
      content: content ?? this.content,
      category: category ?? this.category,
      isEnabled: isEnabled ?? this.isEnabled,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'category': category,
      'isEnabled': isEnabled,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory AIMemoryModel.fromJson(Map<String, dynamic> json) {
    return AIMemoryModel(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? 'preference',
      isEnabled: json['isEnabled'] ?? true,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
