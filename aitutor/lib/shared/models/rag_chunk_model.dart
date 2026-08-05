class RAGChunk {
  final String id;
  final String documentId;
  final String courseId;
  final String documentTitle;
  final String content;
  final int pageNumber;
  final int chunkIndex;
  final List<double> embedding;

  RAGChunk({
    required this.id,
    required this.documentId,
    required this.courseId,
    required this.documentTitle,
    required this.content,
    required this.pageNumber,
    required this.chunkIndex,
    required this.embedding,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'documentId': documentId,
    'courseId': courseId,
    'documentTitle': documentTitle,
    'content': content,
    'pageNumber': pageNumber,
    'chunkIndex': chunkIndex,
    'embedding': embedding,
  };

  factory RAGChunk.fromJson(Map<String, dynamic> json) => RAGChunk(
    id: json['id'] ?? '',
    documentId: json['documentId'] ?? '',
    courseId: json['courseId'] ?? '',
    documentTitle: json['documentTitle'] ?? '',
    content: json['content'] ?? '',
    pageNumber: json['pageNumber'] ?? 1,
    chunkIndex: json['chunkIndex'] ?? 0,
    embedding: (json['embedding'] as List<dynamic>?)?.map((e) => (e as num).toDouble()).toList() ?? [],
  );
}
