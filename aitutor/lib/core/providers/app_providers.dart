import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../services/gemini_service.dart';
import '../services/rag_engine.dart';
import '../services/elevenlabs_service.dart';
import '../services/supabase_service.dart';
import '../../shared/models/course_model.dart';
import '../../shared/models/document_model.dart';
import '../../shared/models/chat_message_model.dart';
import '../../shared/models/quiz_model.dart';
import '../../shared/models/user_profile_model.dart';
import '../../shared/models/study_task_model.dart';

// Services
final geminiServiceProvider = Provider<GeminiService>((ref) => GeminiService());
final ragEngineProvider = Provider<RAGEngine>((ref) {
  final gemini = ref.watch(geminiServiceProvider);
  return RAGEngine(gemini);
});
final elevenLabsServiceProvider = Provider<ElevenLabsService>((ref) => ElevenLabsService());

// Selected Course State
final selectedCourseProvider = StateProvider<CourseModel?>((ref) => null);

// Tutor Mode State: 'direct', 'socratic', 'beginner', 'exam'
final tutorModeProvider = StateProvider<String>((ref) => 'direct');

// Voice Speaking State
final isVoiceEnabledProvider = StateProvider<bool>((ref) => false);

// Theme Mode State: Light Theme Default
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

// -------------------------------------------------------------
// User Profile Notifier
// -------------------------------------------------------------
class UserProfileNotifier extends StateNotifier<UserProfileModel> {
  UserProfileNotifier() : super(
    UserProfileModel(
      id: 'u1',
      fullName: 'Junaid',
      email: 'junaid@aitutor.edu',
      university: 'BAUST (Science & Technology)',
      major: 'Computer Science & Engineering',
      academicYear: '3rd Year (Semester VI)',
      avatarPreset: 'scholar',
      streakDays: 12,
      dailyGoalMinutes: 60,
      todayStudyMinutes: 45,
    ),
  ) {
    _loadFromSupabase();
  }

  Future<void> _loadFromSupabase() async {
    final remote = await SupabaseService.fetchUserProfile();
    if (remote != null) {
      state = remote;
    }
  }

  void updateProfile({
    String? fullName,
    String? email,
    String? university,
    String? major,
    String? academicYear,
    String? avatarPath,
    String? avatarPreset,
    int? dailyGoalMinutes,
  }) {
    state = state.copyWith(
      fullName: fullName,
      email: email,
      university: university,
      major: major,
      academicYear: academicYear,
      avatarPath: avatarPath,
      avatarPreset: avatarPreset,
      dailyGoalMinutes: dailyGoalMinutes,
    );
    SupabaseService.saveUserProfile(state);
  }

  void setAvatarPath(String path) {
    state = UserProfileModel(
      id: state.id,
      fullName: state.fullName,
      email: state.email,
      university: state.university,
      major: state.major,
      academicYear: state.academicYear,
      avatarPath: path,
      avatarPreset: state.avatarPreset,
      streakDays: state.streakDays,
      dailyGoalMinutes: state.dailyGoalMinutes,
      todayStudyMinutes: state.todayStudyMinutes,
    );
    SupabaseService.saveUserProfile(state);
  }

  void setAvatarPreset(String preset) {
    state = UserProfileModel(
      id: state.id,
      fullName: state.fullName,
      email: state.email,
      university: state.university,
      major: state.major,
      academicYear: state.academicYear,
      avatarPath: null,
      avatarPreset: preset,
      streakDays: state.streakDays,
      dailyGoalMinutes: state.dailyGoalMinutes,
      todayStudyMinutes: state.todayStudyMinutes,
    );
    SupabaseService.saveUserProfile(state);
  }

  void incrementStudyTime(int minutes) {
    state = state.copyWith(todayStudyMinutes: state.todayStudyMinutes + minutes);
    SupabaseService.saveUserProfile(state);
  }
}

final userProfileProvider = StateNotifierProvider<UserProfileNotifier, UserProfileModel>((ref) {
  return UserProfileNotifier();
});

// -------------------------------------------------------------
// Courses Notifier - Full CRUD
// -------------------------------------------------------------
class CoursesNotifier extends StateNotifier<List<CourseModel>> {
  CoursesNotifier() : super(_initialDefaultCourses) {
    _loadFromSupabase();
  }

  static final List<CourseModel> _initialDefaultCourses = [
    CourseModel(
      id: 'c1',
      title: 'Computer Architecture',
      code: 'CSE-3101',
      semester: 'Fall 2026',
      colorHex: '#6366F1',
      documentCount: 2,
      masteryScore: 82,
    ),
    CourseModel(
      id: 'c2',
      title: 'Operating Systems',
      code: 'CSE-3103',
      semester: 'Fall 2026',
      colorHex: '#10B981',
      documentCount: 1,
      masteryScore: 64,
    ),
    CourseModel(
      id: 'c3',
      title: 'Database Management Systems',
      code: 'CSE-3105',
      semester: 'Fall 2026',
      colorHex: '#F59E0B',
      documentCount: 3,
      masteryScore: 90,
    ),
  ];

  Future<void> _loadFromSupabase() async {
    final remoteCourses = await SupabaseService.fetchCourses();
    if (remoteCourses.isNotEmpty) {
      state = remoteCourses;
    } else {
      for (final c in state) {
        SupabaseService.saveCourse(c);
      }
    }
  }

  void addCourse({
    required String title,
    required String code,
    required String colorHex,
    String semester = 'Fall 2026',
  }) {
    final newCourse = CourseModel(
      id: const Uuid().v4(),
      title: title,
      code: code,
      semester: semester,
      colorHex: colorHex,
      documentCount: 0,
      masteryScore: 50,
    );
    state = [...state, newCourse];
    SupabaseService.saveCourse(newCourse);
  }

  void updateCourse(CourseModel updatedCourse) {
    state = state.map((c) => c.id == updatedCourse.id ? updatedCourse : c).toList();
    SupabaseService.saveCourse(updatedCourse);
  }

  void deleteCourse(String id) {
    state = state.where((c) => c.id != id).toList();
    SupabaseService.deleteCourse(id);
  }
}

final coursesProvider = StateNotifierProvider<CoursesNotifier, List<CourseModel>>((ref) {
  return CoursesNotifier();
});

// -------------------------------------------------------------
// Documents Notifier - Full CRUD
// -------------------------------------------------------------
class DocumentsNotifier extends StateNotifier<List<DocumentModel>> {
  final Ref ref;
  DocumentsNotifier(this.ref) : super([
    DocumentModel(
      id: 'd1',
      courseId: 'c1',
      title: 'Lecture 05 - CPU Pipelining & Cache.pdf',
      fileType: 'pdf',
      pageCount: 18,
      chunkCount: 12,
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      fullContent: """
[Page 1]
COMPUTER ARCHITECTURE - LECTURE 05
Topic: CPU Pipelining and Cache Memory Latency

[Page 2]
1. CPU PIPELINING OVERVIEW
Pipelining is an implementation technique where multiple instructions are overlapped in execution.
The pipeline is divided into stages:
- IF: Instruction Fetch
- ID: Instruction Decode
- EX: Execute / Address Calculation
- MEM: Memory Access
- WB: Write Back

[Page 3]
Pipeline Hazards:
1. Structural Hazards: Resource conflicts when hardware cannot support all pipeline combinations.
2. Data Hazards: When an instruction depends on the result of a previous instruction still in the pipeline.
3. Control Hazards: Caused by branch instructions that delay the next instruction fetch.

[Page 4]
2. CACHE MEMORY HIERARCHY
Cache memory is a small, high-speed memory located near the CPU that minimizes access latency by storing frequently used instructions and data.
Access latency comparison:
- Register: < 1 ns
- L1 Cache: 1-2 ns (SRAM)
- L2 Cache: 3-5 ns
- Main Memory (RAM): 50-100 ns (DRAM)

[Page 5]
Locality of Reference:
- Temporal Locality: If an item is referenced, it will tend to be referenced again soon.
- Spatial Locality: If an item is referenced, items with nearby addresses tend to be referenced soon.
""",
    ),
    DocumentModel(
      id: 'd2',
      courseId: 'c2',
      title: 'OS Lecture 03 - Process Scheduling & Deadlocks.pdf',
      fileType: 'pdf',
      pageCount: 24,
      chunkCount: 15,
      createdAt: DateTime.now().subtract(const Duration(days: 4)),
      fullContent: """
[Page 1]
OPERATING SYSTEMS - LECTURE 03
Topic: Process Scheduling and Deadlock Prevention

[Page 2]
A deadlock is a situation where a set of processes are blocked because each process holds a resource and waits for another resource held by some other process.
4 Necessary Conditions for Deadlock:
1. Mutual Exclusion
2. Hold and Wait
3. No Preemption
4. Circular Wait
""",
    )
  ]) {
    _initializeIndex();
  }

  Future<void> _initializeIndex() async {
    final remoteDocs = await SupabaseService.fetchDocuments();
    if (remoteDocs.isNotEmpty) {
      state = remoteDocs;
    } else {
      for (final doc in state) {
        SupabaseService.saveDocument(doc);
      }
    }

    final ragEngine = ref.read(ragEngineProvider);
    for (final doc in state) {
      if (doc.fullContent != null) {
        await ragEngine.processAndChunkDocument(
          documentId: doc.id,
          courseId: doc.courseId,
          documentTitle: doc.title,
          fullText: doc.fullContent!,
        );
      }
    }
  }

  Future<void> uploadDocument({
    required String courseId,
    required String title,
    required String fullText,
    int? pageCountOverride,
  }) async {
    final docId = const Uuid().v4();
    
    int pageCount;
    if (pageCountOverride != null && pageCountOverride > 0) {
      pageCount = pageCountOverride;
    } else {
      final pageMarkerMatches = RegExp(r'\[Page\s*\d+\]|---+\s*Page\s*\d+|Page\s+\d+:\s*|\f', caseSensitive: false).allMatches(fullText).length;
      if (pageMarkerMatches > 0) {
        pageCount = pageMarkerMatches;
      } else {
        final wordCount = fullText.split(RegExp(r'\s+')).where((s) => s.isNotEmpty).length;
        pageCount = (wordCount / 120).ceil().clamp(1, 999);
      }
    }

    final ragEngine = ref.read(ragEngineProvider);
    final chunks = await ragEngine.processAndChunkDocument(
      documentId: docId,
      courseId: courseId,
      documentTitle: title,
      fullText: fullText,
    );

    final newDoc = DocumentModel(
      id: docId,
      courseId: courseId,
      title: title,
      fileType: title.endsWith('.pdf') ? 'pdf' : 'txt',
      pageCount: pageCount > 0 ? pageCount : 1,
      chunkCount: chunks.length,
      createdAt: DateTime.now(),
      fullContent: fullText,
    );

    state = [newDoc, ...state];
    SupabaseService.saveDocument(newDoc);

    // Save chunks & embeddings to Supabase DB
    for (final chunk in chunks) {
      SupabaseService.saveChunk(
        id: chunk.id,
        documentId: docId,
        courseId: courseId,
        content: chunk.content,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        embedding: chunk.embedding,
      );
    }

    // Update document count on course
    final coursesNotifier = ref.read(coursesProvider.notifier);
    final currentCourses = ref.read(coursesProvider);
    coursesNotifier.state = currentCourses.map((c) {
      if (c.id == courseId) {
        final updatedCourse = CourseModel(
          id: c.id,
          title: c.title,
          code: c.code,
          semester: c.semester,
          colorHex: c.colorHex,
          documentCount: c.documentCount + 1,
          masteryScore: c.masteryScore,
        );
        SupabaseService.saveCourse(updatedCourse);
        return updatedCourse;
      }
      return c;
    }).toList();
  }

  void updateDocument({
    required String id,
    String? title,
    int? pageCount,
  }) {
    state = state.map((d) {
      if (d.id == id) {
        final updated = DocumentModel(
          id: d.id,
          courseId: d.courseId,
          title: title ?? d.title,
          fileType: d.fileType,
          pageCount: pageCount ?? d.pageCount,
          chunkCount: d.chunkCount,
          createdAt: d.createdAt,
          fullContent: d.fullContent,
        );
        SupabaseService.saveDocument(updated);
        return updated;
      }
      return d;
    }).toList();
  }

  void renameDocument({required String id, required String newTitle}) {
    updateDocument(id: id, title: newTitle);
  }

  void deleteDocument(String id) {
    state = state.where((d) => d.id != id).toList();
    SupabaseService.deleteDocument(id);
  }
}

final documentsProvider = StateNotifierProvider<DocumentsNotifier, List<DocumentModel>>((ref) {
  return DocumentsNotifier(ref);
});

// -------------------------------------------------------------
// Chat Messages Notifier
// -------------------------------------------------------------
class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  final Ref ref;
  ChatNotifier(this.ref) : super([
    ChatMessage(
      id: 'm1',
      role: 'assistant',
      text: "Hello! I am your AI Study Companion. Select a course or ask any question regarding your uploaded lecture notes, textbooks, or slides!",
      timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
    ),
  ]) {
    _loadFromSupabase();
  }

  Future<void> _loadFromSupabase() async {
    final remoteMsgs = await SupabaseService.fetchChatMessages();
    if (remoteMsgs.isNotEmpty) {
      state = remoteMsgs;
    } else {
      for (final m in state) {
        SupabaseService.saveChatMessage(m);
      }
    }
  }

  bool isLoading = false;

  Future<void> sendMessage(String question) async {
    if (question.trim().isEmpty) return;

    final userMsg = ChatMessage(
      id: const Uuid().v4(),
      role: 'user',
      text: question,
      timestamp: DateTime.now(),
    );

    state = [...state, userMsg];
    SupabaseService.saveChatMessage(userMsg);
    isLoading = true;

    try {
      final selectedCourse = ref.read(selectedCourseProvider);
      final tutorMode = ref.read(tutorModeProvider);
      final ragEngine = ref.read(ragEngineProvider);
      final geminiService = ref.read(geminiServiceProvider);
      final elevenLabs = ref.read(elevenLabsServiceProvider);
      final isVoiceEnabled = ref.read(isVoiceEnabledProvider);

      final relevantChunks = await ragEngine.retrieveRelevantChunks(
        query: question,
        courseId: selectedCourse?.id,
        topK: 4,
      );

      final ragResponse = await geminiService.generateRAGAnswer(
        question: question,
        chunks: relevantChunks,
        tutorMode: tutorMode,
        chatHistory: state,
      );

      final assistantMsg = ChatMessage(
        id: const Uuid().v4(),
        role: 'assistant',
        text: ragResponse.answer,
        citations: ragResponse.citations,
        timestamp: DateTime.now(),
      );

      state = [...state, assistantMsg];
      SupabaseService.saveChatMessage(assistantMsg);

      if (isVoiceEnabled) {
        await elevenLabs.speak(ragResponse.answer);
      }
    } catch (e) {
      final errorMsg = ChatMessage(
        id: const Uuid().v4(),
        role: 'assistant',
        text: "I encountered an error generating the answer. Please check your internet connection or try rephrasing your query.",
        timestamp: DateTime.now(),
      );
      state = [...state, errorMsg];
      SupabaseService.saveChatMessage(errorMsg);
    } finally {
      isLoading = false;
    }
  }

  void clearChat() {
    final welcomeMsg = ChatMessage(
      id: const Uuid().v4(),
      role: 'assistant',
      text: "Chat cleared! Ask me anything from your study materials.",
      timestamp: DateTime.now(),
    );
    state = [welcomeMsg];
    SupabaseService.saveChatMessage(welcomeMsg);
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, List<ChatMessage>>((ref) {
  return ChatNotifier(ref);
});

// -------------------------------------------------------------
// Quiz Notifier - Full CRUD
// -------------------------------------------------------------
class QuizNotifier extends StateNotifier<List<QuizQuestion>> {
  final Ref ref;
  bool isGenerating = false;

  QuizNotifier(this.ref) : super([
    QuizQuestion(
      id: 'q1',
      question: "Which of the following is a pipeline hazard caused by instruction dependencies?",
      options: ["Structural Hazard", "Data Hazard", "Control Hazard", "Bus Hazard"],
      correctIndex: 1,
      explanation: "Data hazards occur when instructions that exhibit data dependence modify data in different stages of a pipeline.",
      topic: "CPU Pipelining",
    ),
    QuizQuestion(
      id: 'q2',
      question: "Why is SRAM used for L1 CPU cache instead of DRAM?",
      options: ["SRAM is cheaper", "SRAM is faster and does not require refreshing", "SRAM has higher density", "SRAM uses less chip space"],
      correctIndex: 1,
      explanation: "SRAM (Static RAM) uses flip-flops and is much faster than DRAM, making it ideal for cache memory.",
      topic: "Cache Hierarchy",
    )
  ]);

  Future<void> generateQuizForTopic(String topic) async {
    isGenerating = true;
    try {
      final gemini = ref.read(geminiServiceProvider);
      final documents = ref.read(documentsProvider);

      final contextText = documents
          .map((d) => d.fullContent ?? '')
          .where((t) => t.isNotEmpty)
          .join('\n\n');

      final rawQuestions = await gemini.generateQuiz(
        topic: topic,
        contextText: contextText,
        count: 5,
      );

      final questions = rawQuestions.map((q) => QuizQuestion.fromJson(q)).toList();
      state = questions;
    } catch (e) {
      // Keep existing
    } finally {
      isGenerating = false;
    }
  }

  void addQuestion(QuizQuestion q) {
    state = [...state, q];
  }

  void deleteQuestion(String id) {
    state = state.where((q) => q.id != id).toList();
  }

  void resetQuiz() {
    state = [];
  }
}

final quizProvider = StateNotifierProvider<QuizNotifier, List<QuizQuestion>>((ref) {
  return QuizNotifier(ref);
});

// -------------------------------------------------------------
// Study Tasks Notifier - Full CRUD
// -------------------------------------------------------------
class StudyTasksNotifier extends StateNotifier<List<StudyTaskModel>> {
  StudyTasksNotifier() : super([
    StudyTaskModel(
      id: 't1',
      dayGroup: 'Today',
      courseTitle: 'Computer Architecture',
      topicSubtitle: 'CPU Pipelining & Hazard Resolution',
      timeSpan: '07:00 - 08:00 PM',
      isCompleted: true,
    ),
    StudyTaskModel(
      id: 't2',
      dayGroup: 'Today',
      courseTitle: 'Operating Systems',
      topicSubtitle: 'Deadlock 4 Conditions & Circular Wait',
      timeSpan: '08:15 - 09:00 PM',
      isCompleted: false,
    ),
    StudyTaskModel(
      id: 't3',
      dayGroup: 'Today',
      courseTitle: 'Revision Quiz',
      topicSubtitle: '5 Questions on Pipeline Data Hazards',
      timeSpan: '09:15 - 09:45 PM',
      isCompleted: false,
    ),
    StudyTaskModel(
      id: 't4',
      dayGroup: 'Tomorrow',
      courseTitle: 'Database Systems',
      topicSubtitle: 'SQL JOIN Optimization & B-Trees',
      timeSpan: '07:00 - 08:00 PM',
      isCompleted: false,
    ),
  ]);

  void addTask({
    required String dayGroup,
    required String courseTitle,
    required String topicSubtitle,
    required String timeSpan,
  }) {
    final newTask = StudyTaskModel(
      id: const Uuid().v4(),
      dayGroup: dayGroup,
      courseTitle: courseTitle,
      topicSubtitle: topicSubtitle,
      timeSpan: timeSpan,
      isCompleted: false,
    );
    state = [...state, newTask];
  }

  void updateTask(StudyTaskModel updatedTask) {
    state = state.map((t) => t.id == updatedTask.id ? updatedTask : t).toList();
  }

  void toggleTaskCompletion(String id) {
    state = state.map((t) {
      if (t.id == id) {
        return t.copyWith(isCompleted: !t.isCompleted);
      }
      return t;
    }).toList();
  }

  void deleteTask(String id) {
    state = state.where((t) => t.id != id).toList();
  }
}

final studyTasksProvider = StateNotifierProvider<StudyTasksNotifier, List<StudyTaskModel>>((ref) {
  return StudyTasksNotifier();
});
