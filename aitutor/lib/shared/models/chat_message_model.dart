class Citation {
  final String documentTitle;
  final int pageNumber;
  final String snippet;

  Citation({
    required this.documentTitle,
    required this.pageNumber,
    required this.snippet,
  });

  Map<String, dynamic> toJson() => {
    'documentTitle': documentTitle,
    'pageNumber': pageNumber,
    'snippet': snippet,
  };

  factory Citation.fromJson(Map<String, dynamic> json) => Citation(
    documentTitle: json['documentTitle'] ?? '',
    pageNumber: json['pageNumber'] ?? 1,
    snippet: json['snippet'] ?? '',
  );
}

class ChatMessage {
  final String id;
  final String role; // 'user' or 'assistant'
  final String text;
  final List<Citation> citations;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.role,
    required this.text,
    this.citations = const [],
    required this.timestamp,
  });

  bool get isUser => role == 'user';
}
