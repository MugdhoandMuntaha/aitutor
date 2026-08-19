import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_generative_ai/google_generative_ai.dart';
import '../config/env_config.dart';
import '../../shared/models/rag_chunk_model.dart';
import '../../shared/models/chat_message_model.dart';

class GeminiService {
  GenerativeModel? _textModel;
  GenerativeModel? _embeddingModel;

  GeminiService() {
    final apiKey = EnvConfig.geminiApiKey;
    if (apiKey.isNotEmpty && apiKey.startsWith('AIzaSy')) {
      try {
        _textModel = GenerativeModel(
          model: 'gemini-2.5-flash',
          apiKey: apiKey,
        );
        _embeddingModel = GenerativeModel(
          model: 'text-embedding-004',
          apiKey: apiKey,
        );
      } catch (e) {
        // Ignored, will fall back to Groq API
      }
    }
  }

  /// Helper to send prompt to Groq API (`openai/gpt-oss-20b` or `qwen/qwen3.6-27b`)
  Future<String?> _callGroqApi(String systemPrompt, String userPrompt, {List<ChatMessage> chatHistory = const []}) async {
    final groqKey = EnvConfig.groqApiKey;
    if (groqKey.isEmpty) return null;

    final List<Map<String, String>> messagesList = [
      {'role': 'system', 'content': systemPrompt},
    ];

    if (chatHistory.isNotEmpty) {
      final recent = chatHistory.length > 6 ? chatHistory.sublist(chatHistory.length - 6) : chatHistory;
      for (final msg in recent) {
        messagesList.add({
          'role': msg.isUser ? 'user' : 'assistant',
          'content': msg.text,
        });
      }
    }

    messagesList.add({'role': 'user', 'content': userPrompt});

    final modelsToTry = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ];

    for (final model in modelsToTry) {
      try {
        final response = await http.post(
          Uri.parse('https://api.groq.com/openai/v1/chat/completions'),
          headers: {
            'Authorization': 'Bearer $groqKey',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'model': model,
            'messages': messagesList,
            'temperature': 0.3,
            'max_tokens': 1500,
          }),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(utf8.decode(response.bodyBytes));
          final content = data['choices']?[0]?['message']?['content'];
          if (content != null && content.toString().trim().isNotEmpty) {
            return content.toString();
          }
        }
      } catch (e) {
        // Try next model
      }
    }
    return null;
  }

  /// Bulletproof answer extractor from JSON / raw responses
  String _cleanAndExtractAnswer(String rawText) {
    if (rawText.trim().isEmpty) return "";

    String cleaned = rawText.trim();

    // 1. Strip markdown fences if present
    cleaned = cleaned.replaceAll(RegExp(r'^```json\s*', caseSensitive: false), '');
    cleaned = cleaned.replaceAll(RegExp(r'^```\s*'), '');
    cleaned = cleaned.replaceAll(RegExp(r'```$'), '').trim();

    // 2. Try standard jsonDecode first
    try {
      final parsed = jsonDecode(cleaned);
      if (parsed is Map && parsed.containsKey('answer') && parsed['answer'] != null) {
        String ans = parsed['answer'].toString();
        return ans.replaceAll(r'\n', '\n');
      }
    } catch (e) {
      // Fallthrough
    }

    // 3. Regex match for "answer": "..."
    final answerRegex = RegExp(r'"answer"\s*:\s*"((?:[^"\\]|\\.)*)"', dotAll: true);
    final match = answerRegex.firstMatch(cleaned);
    if (match != null) {
      String extracted = match.group(1) ?? '';
      extracted = extracted
          .replaceAll(r'\"', '"')
          .replaceAll(r'\n', '\n')
          .replaceAll(r'\r', '')
          .replaceAll(r'\t', '  ');
      if (extracted.trim().isNotEmpty) {
        return extracted;
      }
    }

    // 4. Manual slice if response starts with {"answer":
    if (cleaned.startsWith('{') && cleaned.contains('"answer"')) {
      final startIndex = cleaned.indexOf('"answer"');
      if (startIndex != -1) {
        final colonIndex = cleaned.indexOf(':', startIndex);
        if (colonIndex != -1) {
          String valPart = cleaned.substring(colonIndex + 1).trim();
          if (valPart.startsWith('"')) {
            valPart = valPart.substring(1);
          }
          if (valPart.contains('","citations"')) {
            valPart = valPart.substring(0, valPart.indexOf('","citations"'));
          } else if (valPart.contains('",\n"citations"')) {
            valPart = valPart.substring(0, valPart.indexOf('",\n"citations"'));
          } else if (valPart.endsWith('"}')) {
            valPart = valPart.substring(0, valPart.length - 2);
          }
          return valPart.replaceAll(r'\"', '"').replaceAll(r'\n', '\n');
        }
      }
    }

    return cleaned.replaceAll(r'\n', '\n');
  }

  /// Generate a 768-dimensional embedding vector for text chunking
  Future<List<double>> generateEmbedding(String text) async {
    if (_embeddingModel != null) {
      try {
        final response = await _embeddingModel!.embedContent(Content.text(text));
        return response.embedding.values;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback deterministic pseudo-embedding generator
    final bytes = utf8.encode(text);
    final List<double> vector = List.filled(768, 0.0);
    for (int i = 0; i < bytes.length && i < 768; i++) {
      vector[i] = (bytes[i] % 100) / 100.0;
    }
    return vector;
  }

  /// RAG Answer Generation grounded in retrieved document chunks
  Future<RAGResponse> generateRAGAnswer({
    required String question,
    required List<RAGChunk> chunks,
    String tutorMode = 'direct', // 'direct', 'socratic', 'beginner', 'exam'
    List<ChatMessage> chatHistory = const [],
    String userMemoriesPrompt = "",
  }) async {
    final contextBuffer = StringBuffer();
    for (int i = 0; i < chunks.length; i++) {
      final chunk = chunks[i];
      contextBuffer.writeln("--- CHUNK ${i + 1} ---");
      contextBuffer.writeln("Document: ${chunk.documentTitle}");
      contextBuffer.writeln("Page: ${chunk.pageNumber}");
      contextBuffer.writeln("Content:\n${chunk.content}\n");
    }

    String modeInstruction = "";
    if (tutorMode == 'socratic') {
      modeInstruction = "SOCRATIC TUTOR MODE: Do NOT give the direct final answer immediately. Ask a guiding, thought-provoking follow-up question to test the student's understanding.";
    } else if (tutorMode == 'beginner') {
      modeInstruction = "EXPLAIN LIKE I'M A BEGINNER MODE: Use simple analogies, plain English, and real-world examples.";
    } else if (tutorMode == 'exam') {
      modeInstruction = "EXAM REVISION MODE: Provide concise, highly technical key points formatted clearly for exam scoring. Include bullet points, diagrams or tables where useful.";
    } else {
      modeInstruction = "DIRECT TUTOR MODE: Provide a comprehensive academic explanation, using Markdown formatting, lists, tables, and equations where applicable.";
    }

    final memoriesSection = userMemoriesPrompt.trim().isNotEmpty
        ? "\n\n$userMemoriesPrompt\n"
        : "";

    final systemPrompt = """
You are an expert AI Academic Tutor for university students.
$modeInstruction$memoriesSection

INSTRUCTIONS:
1. Provide a clear, thorough academic response to the student's question.
2. Ground your explanation primarily in the RETRIEVED ACADEMIC CONTEXT provided by the user. If the retrieved context is partial or incomplete, supplement with your full academic knowledge to give a complete answer.
3. MATHEMATICAL EQUATIONS: Always format equations on separate lines using LaTeX double dollar syntax like: \$\$\\text{CPI} = \\frac{\\text{Total CPU Clock Cycles}}{\\text{Number of Instructions Executed}}\$\$. Use standard LaTeX \\frac{num}{den}, \\sum, \\times, _{subscript} and \\text{...} so equations render in LaTeX equation boxes.
4. Citing sources: If context is available, cite in-line as [Doc: <Title>, Page: <Number>].
5. Output MUST be raw JSON object with keys "answer" (markdown string) and "citations" (array of objects with documentTitle, pageNumber, snippet).
""";

    final historyBuffer = StringBuffer();
    if (chatHistory.isNotEmpty) {
      final recent = chatHistory.length > 6 ? chatHistory.sublist(chatHistory.length - 6) : chatHistory;
      for (final msg in recent) {
        historyBuffer.writeln("${msg.isUser ? 'Student' : 'Tutor'}: ${msg.text}");
      }
    }

    final userPrompt = """
CONVERSATION HISTORY (PAST TURNS):
${historyBuffer.isEmpty ? "No prior messages." : historyBuffer.toString()}

CURRENT STUDENT QUESTION: "$question"

RETRIEVED ACADEMIC CONTEXT:
${contextBuffer.isEmpty ? "No uploaded course documents were retrieved for this specific query." : contextBuffer.toString()}
""";

    // 1. Try Groq API first
    final groqResult = await _callGroqApi(systemPrompt, userPrompt, chatHistory: chatHistory);
    if (groqResult != null) {
      final cleanAnswer = _cleanAndExtractAnswer(groqResult);
      List<Citation> citations = [];

      try {
        final cleanJson = groqResult.replaceAll('```json', '').replaceAll('```', '').trim();
        final Map<String, dynamic> data = jsonDecode(cleanJson);
        final List<dynamic> rawCitations = data['citations'] ?? [];
        citations = rawCitations.map((c) => Citation(
          documentTitle: c['documentTitle'] ?? c['document'] ?? 'Course Context',
          pageNumber: c['pageNumber'] ?? c['page'] ?? 1,
          snippet: c['snippet'] ?? '',
        )).toList();
      } catch (e) {
        // Ignored
      }

      return RAGResponse(
        answer: cleanAnswer,
        citations: citations.isNotEmpty ? citations : _createCitationsFromChunks(chunks),
      );
    }

    // 2. Try Gemini SDK if configured
    if (_textModel != null) {
      try {
        final response = await _textModel!.generateContent([Content.text("$systemPrompt\n$userPrompt")]);
        final text = response.text ?? '';
        final cleanAnswer = _cleanAndExtractAnswer(text);
        List<Citation> citations = [];
        try {
          final cleanJson = text.replaceAll('```json', '').replaceAll('```', '').trim();
          final Map<String, dynamic> data = jsonDecode(cleanJson);
          final List<dynamic> rawCitations = data['citations'] ?? [];
          citations = rawCitations.map((c) => Citation(
            documentTitle: c['documentTitle'] ?? 'Course Context',
            pageNumber: c['pageNumber'] ?? 1,
            snippet: c['snippet'] ?? '',
          )).toList();
        } catch (e) {
          // Ignored
        }

        return RAGResponse(
          answer: cleanAnswer,
          citations: citations.isNotEmpty ? citations : _createCitationsFromChunks(chunks),
        );
      } catch (e) {
        // Fallthrough
      }
    }

    // 3. Fallback Synthesizer for offline / missing keys
    return RAGResponse(
      answer: _generateOfflineAcademicAnswer(question, chunks, tutorMode),
      citations: _createCitationsFromChunks(chunks),
    );
  }

  List<Citation> _createCitationsFromChunks(List<RAGChunk> chunks) {
    return chunks.map((c) => Citation(
      documentTitle: c.documentTitle,
      pageNumber: c.pageNumber,
      snippet: c.content.length > 80 ? "${c.content.substring(0, 80)}..." : c.content,
    )).toList();
  }

  String _generateOfflineAcademicAnswer(String question, List<RAGChunk> chunks, String tutorMode) {
    final lowerQ = question.toLowerCase();

    if (chunks.isNotEmpty) {
      return """
### Grounded Course Material Summary

${chunks.map((c) => "**From ${c.documentTitle} (Page ${c.pageNumber})**:\n${c.content}").join("\n\n")}
""";
    }

    if (lowerQ.contains('formula') || lowerQ.contains('architecture') || lowerQ.contains('cpi') || lowerQ.contains('ips') || lowerQ.contains('amdahl') || lowerQ.contains('pipeline')) {
      return r"""
### Core Computer Architecture & CPI Formulas 💻⚡

In **Computer Organization & Architecture (COA)**, CPI (Cycles Per Instruction) is:

$$\text{CPI} = \frac{\text{Total CPU Clock Cycles}}{\text{Number of Instructions Executed}}$$

If different instructions have different CPIs:

$$\text{Average CPI} = \frac{\sum(\text{Instruction Count}_i \times \text{CPI}_i)}{\text{Total Instruction Count}}$$

Or, using instruction percentages:

$$\text{Average CPI} = \sum(\text{Instruction Fraction}_i \times \text{CPI}_i)$$

#### Additional Performance Metrics

**1. CPU Execution Time**
$$\text{CPU Execution Time} = \frac{\text{Instruction Count} \times \text{CPI}}{\text{Clock Rate (Hz)}}$$

**2. MIPS (Millions of Instructions Per Second)**
$$\text{MIPS} = \frac{\text{Instruction Count}}{\text{Execution Time} \times 10^6} = \frac{\text{Clock Rate (MHz)}}{\text{CPI}}$$

**3. Amdahl's Law (Speedup Calculation)**
$$\text{Speedup}_{\text{overall}} = \frac{1}{(1 - f) + \frac{f}{S}}$$

- **f** = Fraction of execution time that is enhanced
- **S** = Speedup factor of the enhanced portion

**4. Pipelining Performance & Ideal Speedup**
$$\text{Speedup}_{\text{pipeline}} = \frac{\text{Time}_{\text{unpipelined}}}{\text{Time}_{\text{pipelined}}} = \frac{k \times n}{k + n - 1}$$

*(Where **k** = number of pipeline stages, **n** = number of instructions. As **n → ∞**, Speedup **≈ k**)*
""";
    }

    if (lowerQ.contains('osi') || lowerQ.contains('layer') || lowerQ.contains('network')) {
      return """
### OSI 7-Layer Reference Model (Exam Summary) 🌐

1. **Layer 7 - Application**: Direct user-network interface (**HTTP, SMTP, FTP, DNS**).
2. **Layer 6 - Presentation**: Syntax translation, encryption/decryption (**SSL/TLS, ASCII, JPEG**).
3. **Layer 5 - Session**: Manages and terminates application sessions (**RPC, NetBIOS**).
4. **Layer 4 - Transport**: End-to-end transport, error control, port addressing (**TCP, UDP**).
5. **Layer 3 - Network**: Logical IP routing and packet forwarding (**IPv4/IPv6, ICMP, BGP**).
6. **Layer 2 - Data Link**: Physical MAC addressing, framing (**Ethernet, Wi-Fi 802.11**).
7. **Layer 1 - Physical**: Raw binary bit stream transmission over physical media (**Cables, Fiber, Radio**).
""";
    }

    return """
### Overview of "$question"

Here is a structured academic summary for **"$question"**:

1. **Key Concept**: This topic forms a foundational element of university computer science curricula.
2. **Core Components**: Ensure you focus on system constraints, performance trade-offs, and algorithmic efficiency.
3. **Study Recommendation**: Upload related lecture slides or textbook PDFs in the **Courses** tab for grounded citations and tailored quiz generation!
""";
  }

  /// Generate AI Quiz Questions from course context
  Future<List<Map<String, dynamic>>> generateQuiz({
    required String topic,
    required String contextText,
    int count = 5,
  }) async {
    final systemPrompt = "You are an AI Exam Creator. Return ONLY a valid JSON array of quiz objects.";
    final userPrompt = """
Generate an interactive multiple-choice quiz of $count questions on the topic "$topic".
Material:
$contextText

Return raw JSON array:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this option is correct based on course material.",
    "topic": "$topic"
  }
]
""";

    final groqResult = await _callGroqApi(systemPrompt, userPrompt);
    if (groqResult != null) {
      try {
        final cleanJson = groqResult.replaceAll('```json', '').replaceAll('```', '').trim();
        final List<dynamic> list = jsonDecode(cleanJson);
        return list.cast<Map<String, dynamic>>();
      } catch (e) {
        // Fallthrough
      }
    }

    return [
      {
        "question": "What is the primary benefit of CPU cache memory?",
        "options": [
          "Reduces memory access latency",
          "Increases disk storage size",
          "Eliminates GPU rendering",
          "Slows down bus speed"
        ],
        "correctIndex": 0,
        "explanation": "Cache memory is a small, high-speed memory located near the CPU that minimizes access latency.",
        "topic": topic
      }
    ];
  }

  /// Generate Flashcards deck
  Future<List<Map<String, String>>> generateFlashcards({
    required String topic,
    required String contextText,
    int count = 5,
  }) async {
    final systemPrompt = "You are an AI Study Aid Generator. Return ONLY a valid JSON array.";
    final userPrompt = """
Generate $count study flashcards for "$topic".
Material:
$contextText

Return raw JSON array:
[
  {
    "front": "Question / Concept",
    "back": "Clear concise answer / definition"
  }
]
""";

    final groqResult = await _callGroqApi(systemPrompt, userPrompt);
    if (groqResult != null) {
      try {
        final cleanJson = groqResult.replaceAll('```json', '').replaceAll('```', '').trim();
        final List<dynamic> list = jsonDecode(cleanJson);
        return list.map((e) => Map<String, String>.from(e)).toList();
      } catch (e) {
        // Fallthrough
      }
    }

    return [
      {
        "front": "What is Locality of Reference?",
        "back": "The tendency of a processor to access the same set of memory locations repetitively over a short time period."
      }
    ];
  }
}

class RAGResponse {
  final String answer;
  final List<Citation> citations;

  RAGResponse({required this.answer, required this.citations});
}
