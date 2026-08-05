class QuizQuestion {
  final String id;
  final String question;
  final List<String> options;
  final int correctIndex;
  final String explanation;
  final String topic;

  QuizQuestion({
    required this.id,
    required this.question,
    required this.options,
    required this.correctIndex,
    required this.explanation,
    required this.topic,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) => QuizQuestion(
    id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
    question: json['question'] ?? '',
    options: (json['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    correctIndex: json['correctIndex'] ?? 0,
    explanation: json['explanation'] ?? '',
    topic: json['topic'] ?? 'General',
  );
}
