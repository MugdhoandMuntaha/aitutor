class StudyTaskModel {
  final String id;
  final String dayGroup; // 'Today', 'Tomorrow', 'Upcoming'
  final String courseTitle;
  final String topicSubtitle;
  final String timeSpan;
  final bool isCompleted;

  StudyTaskModel({
    required this.id,
    required this.dayGroup,
    required this.courseTitle,
    required this.topicSubtitle,
    required this.timeSpan,
    this.isCompleted = false,
  });

  StudyTaskModel copyWith({
    String? dayGroup,
    String? courseTitle,
    String? topicSubtitle,
    String? timeSpan,
    bool? isCompleted,
  }) {
    return StudyTaskModel(
      id: id,
      dayGroup: dayGroup ?? this.dayGroup,
      courseTitle: courseTitle ?? this.courseTitle,
      topicSubtitle: topicSubtitle ?? this.topicSubtitle,
      timeSpan: timeSpan ?? this.timeSpan,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}
