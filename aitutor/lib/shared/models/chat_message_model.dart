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

  Map<String, dynamic> toJson() => {
    'id': id,
    'role': role,
    'text': text,
    'citations': citations.map((c) => c.toJson()).toList(),
    'timestamp': timestamp.toIso8601String(),
  };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
    id: json['id'] ?? '',
    role: json['role'] ?? 'assistant',
    text: json['text'] ?? json['content'] ?? '',
    citations: (json['citations'] as List<dynamic>?)
            ?.map((c) => Citation.fromJson(c as Map<String, dynamic>))
            .toList() ??
        [],
    timestamp: json['timestamp'] != null
        ? DateTime.parse(json['timestamp'])
        : (json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now()),
  );
}
