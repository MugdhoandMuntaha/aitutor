import 'dart:math';
import '../../shared/models/rag_chunk_model.dart';
import 'gemini_service.dart';

class RAGEngine {
  final GeminiService _geminiService;
  final List<RAGChunk> _inMemoryChunkIndex = [];

  RAGEngine(this._geminiService);

  /// Split raw document text into semantic chunks with metadata
  Future<List<RAGChunk>> processAndChunkDocument({
    required String documentId,
    required String courseId,
    required String documentTitle,
    required String fullText,
    int chunkSize = 400, // words per chunk approx
  }) async {
    final List<RAGChunk> chunks = [];
    final List<String> pages = fullText.split(RegExp(r'\[Page\s+(\d+)\]'));

    int chunkCounter = 0;

    if (pages.length > 1) {
      for (int i = 1; i < pages.length; i += 2) {
        final pageNum = int.tryParse(pages[i].trim()) ?? 1;
        if (i + 1 >= pages.length) break;
        final pageText = pages[i + 1].trim();

        if (pageText.isEmpty) continue;


        final words = pageText.split(RegExp(r'\s+'));
        for (int w = 0; w < words.length; w += chunkSize) {
          final end = (w + chunkSize < words.length) ? w + chunkSize : words.length;
          final chunkText = words.sublist(w, end).join(' ');

          final embedding = await _geminiService.generateEmbedding(chunkText);
          final chunk = RAGChunk(
            id: "${documentId}_${chunkCounter++}",
            documentId: documentId,
            courseId: courseId,
            documentTitle: documentTitle,
            content: chunkText,
            pageNumber: pageNum,
            chunkIndex: chunkCounter,
            embedding: embedding,
          );
          chunks.add(chunk);
        }
      }
    } else {
      // Fallback simple word chunking
      final words = fullText.split(RegExp(r'\s+'));
      for (int w = 0; w < words.length; w += chunkSize) {
        final end = (w + chunkSize < words.length) ? w + chunkSize : words.length;
        final chunkText = words.sublist(w, end).join(' ');

        final embedding = await _geminiService.generateEmbedding(chunkText);
        final chunk = RAGChunk(
          id: "${documentId}_${chunkCounter++}",
          documentId: documentId,
          courseId: courseId,
          documentTitle: documentTitle,
          content: chunkText,
          pageNumber: (w ~/ 500) + 1,
          chunkIndex: chunkCounter,
          embedding: embedding,
        );
        chunks.add(chunk);
      }
    }

    _inMemoryChunkIndex.addAll(chunks);
    return chunks;
  }

  /// Perform Hybrid Semantic Cosine Similarity search over chunks
  Future<List<RAGChunk>> retrieveRelevantChunks({
    required String query,
    String? courseId,
    int topK = 4,
  }) async {
    final queryEmbedding = await _geminiService.generateEmbedding(query);
    final List<String> queryKeywords = query.toLowerCase().split(RegExp(r'\W+')).where((w) => w.length > 2).toList();

    final List<RAGChunk> candidateChunks = courseId != null
        ? _inMemoryChunkIndex.where((c) => c.courseId == courseId).toList()
        : List.from(_inMemoryChunkIndex);

    if (candidateChunks.isEmpty) {
      return [];
    }

    final ScoredChunkList scoredList = [];

    for (final chunk in candidateChunks) {
      final similarity = _cosineSimilarity(queryEmbedding, chunk.embedding);
      
      // Keyword boost
      double keywordBoost = 0.0;
      final chunkContentLower = chunk.content.toLowerCase();
      for (final kw in queryKeywords) {
        if (chunkContentLower.contains(kw)) {
          keywordBoost += 0.05;
        }
      }

      final finalScore = similarity + min(keywordBoost, 0.2);
      scoredList.add(ScoredChunk(chunk: chunk, score: finalScore));
    }

    scoredList.sort((a, b) => b.score.compareTo(a.score));

    return scoredList.take(topK).map((s) => s.chunk).toList();
  }

  double _cosineSimilarity(List<double> v1, List<double> v2) {
    if (v1.length != v2.length || v1.isEmpty) return 0.0;
    double dotProduct = 0.0;
    double normA = 0.0;
    double normB = 0.0;
    for (int i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }
    if (normA == 0 || normB == 0) return 0.0;
    return dotProduct / (sqrt(normA) * sqrt(normB));
  }
}

typedef ScoredChunkList = List<ScoredChunk>;

class ScoredChunk {
  final RAGChunk chunk;
  final double score;

  ScoredChunk({required this.chunk, required this.score});
}
