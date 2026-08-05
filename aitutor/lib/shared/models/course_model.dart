class CourseModel {
  final String id;
  final String title;
  final String code;
  final String semester;
  final String colorHex;
  final int documentCount;
  final int masteryScore; // 0 to 100

  CourseModel({
    required this.id,
    required this.title,
    required this.code,
    this.semester = 'Fall 2026',
    this.colorHex = '#4F46E5',
    this.documentCount = 0,
    this.masteryScore = 75,
  });

  CourseModel copyWith({
    String? id,
    String? title,
    String? code,
    String? semester,
    String? colorHex,
    int? documentCount,
    int? masteryScore,
  }) {
    return CourseModel(
      id: id ?? this.id,
      title: title ?? this.title,
      code: code ?? this.code,
      semester: semester ?? this.semester,
      colorHex: colorHex ?? this.colorHex,
      documentCount: documentCount ?? this.documentCount,
      masteryScore: masteryScore ?? this.masteryScore,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'code': code,
    'semester': semester,
    'colorHex': colorHex,
    'documentCount': documentCount,
    'masteryScore': masteryScore,
  };

  factory CourseModel.fromJson(Map<String, dynamic> json) => CourseModel(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    code: json['code'] ?? '',
    semester: json['semester'] ?? 'Fall 2026',
    colorHex: json['colorHex'] ?? '#4F46E5',
    documentCount: json['documentCount'] ?? 0,
    masteryScore: json['masteryScore'] ?? 75,
  );
}
