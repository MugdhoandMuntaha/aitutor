class DocumentModel {
  final String id;
  final String courseId;
  final String title;
  final String fileType;
  final int pageCount;
  final int chunkCount;
  final DateTime createdAt;
  final String? fullContent;

  DocumentModel({
    required this.id,
    required this.courseId,
    required this.title,
    this.fileType = 'pdf',
    this.pageCount = 1,
    this.chunkCount = 0,
    required this.createdAt,
    this.fullContent,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'courseId': courseId,
    'title': title,
    'fileType': fileType,
    'pageCount': pageCount,
    'chunkCount': chunkCount,
    'createdAt': createdAt.toIso8601String(),
    'fullContent': fullContent,
  };

  factory DocumentModel.fromJson(Map<String, dynamic> json) => DocumentModel(
    id: json['id'] ?? '',
    courseId: json['courseId'] ?? '',
    title: json['title'] ?? '',
    fileType: json['fileType'] ?? 'pdf',
    pageCount: json['pageCount'] ?? 1,
    chunkCount: json['chunkCount'] ?? 0,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    fullContent: json['fullContent'],
  );
}
