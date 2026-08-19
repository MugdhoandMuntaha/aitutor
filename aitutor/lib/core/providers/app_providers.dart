import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path_provider/path_provider.dart';
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
      id: '550e8400-e29b-41d4-a716-446655440000',
      fullName: 'Student User',
      email: '',
      university: '',
      major: '',
      academicYear: '',
      avatarPreset: 'scholar',
      streakDays: 0,
      dailyGoalMinutes: 60,
      todayStudyMinutes: 0,
    ),
  ) {
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    // 1. Load from local SharedPreferences for instant responsiveness & offline resilience
    try {
      final prefs = await SharedPreferences.getInstance();
      final localPath = prefs.getString('profile_avatar_path');
      final localPreset = prefs.getString('profile_avatar_preset');
      final localName = prefs.getString('profile_full_name');
      final localEmail = prefs.getString('profile_email');
      final localUni = prefs.getString('profile_university');
      final localMajor = prefs.getString('profile_major');
      final localYear = prefs.getString('profile_academic_year');

      if (localName != null || localPath != null || localPreset != null) {
        state = state.copyWith(
          fullName: localName ?? state.fullName,
          email: localEmail ?? state.email,
          university: localUni ?? state.university,
          major: localMajor ?? state.major,
          academicYear: localYear ?? state.academicYear,
          avatarPath: localPath,
          avatarPreset: localPreset ?? state.avatarPreset,
        );
      }
    } catch (e) {
      debugPrint("⚠️ SharedPreferences profile load error: $e");
    }

    // 2. Fetch from Supabase remote database & merge
    try {
      final remote = await SupabaseService.fetchUserProfile();
      if (remote != null) {
        String? mergedPath = remote.avatarPath;
        if (state.avatarPath != null && File(state.avatarPath!).existsSync()) {
          mergedPath = state.avatarPath;
        }
        state = remote.copyWith(avatarPath: mergedPath);
        _saveToSharedPreferences(state);
      }
    } catch (e) {
      debugPrint("⚠️ Supabase profile sync error: $e");
    }
  }

  Future<void> _saveToSharedPreferences(UserProfileModel profile) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (profile.avatarPath != null && profile.avatarPath!.isNotEmpty) {
        await prefs.setString('profile_avatar_path', profile.avatarPath!);
      } else {
        await prefs.remove('profile_avatar_path');
      }
      await prefs.setString('profile_avatar_preset', profile.avatarPreset);
      await prefs.setString('profile_full_name', profile.fullName);
      await prefs.setString('profile_email', profile.email);
      await prefs.setString('profile_university', profile.university);
      await prefs.setString('profile_major', profile.major);
      await prefs.setString('profile_academic_year', profile.academicYear);
    } catch (e) {
      debugPrint("⚠️ SharedPreferences save error: $e");
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
    _saveToSharedPreferences(state);
    SupabaseService.saveUserProfile(state);
  }

  Future<void> setAvatarPath(String sourcePath) async {
    try {
      final appDocDir = await getApplicationDocumentsDirectory();
      final ext = sourcePath.contains('.') ? sourcePath.split('.').last : 'png';
      final savedFile = File('${appDocDir.path}/profile_avatar.$ext');
      final sourceFile = File(sourcePath);

      if (await sourceFile.exists()) {
        await sourceFile.copy(savedFile.path);
        final persistentPath = savedFile.path;

        state = UserProfileModel(
          id: state.id,
          fullName: state.fullName,
          email: state.email,
          university: state.university,
          major: state.major,
          academicYear: state.academicYear,
          avatarPath: persistentPath,
          avatarPreset: state.avatarPreset,
          streakDays: state.streakDays,
          dailyGoalMinutes: state.dailyGoalMinutes,
          todayStudyMinutes: state.todayStudyMinutes,
        );

        await _saveToSharedPreferences(state);
        await SupabaseService.saveUserProfile(state);
      }
    } catch (e) {
      debugPrint("❌ Error persisting avatar path: $e");
    }
  }

  Future<void> setAvatarPreset(String preset) async {
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
    await _saveToSharedPreferences(state);
    await SupabaseService.saveUserProfile(state);
  }

  void incrementStudyTime(int minutes) {
    state = state.copyWith(todayStudyMinutes: state.todayStudyMinutes + minutes);
    _saveToSharedPreferences(state);
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
  CoursesNotifier() : super([]) {
    _loadFromSupabase();
  }

  Future<void> _loadFromSupabase() async {
    final remoteCourses = await SupabaseService.fetchCourses();
    if (remoteCourses.isNotEmpty) {
      state = remoteCourses;
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
      masteryScore: 0,
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
  DocumentsNotifier(this.ref) : super([]) {
    _initializeIndex();
  }

  Future<void> _initializeIndex() async {
    final remoteDocs = await SupabaseService.fetchDocuments();
    if (remoteDocs.isNotEmpty) {
      state = remoteDocs;
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
  ChatNotifier(this.ref) : super([]) {
    _loadFromSupabase();
  }

  Future<void> _loadFromSupabase() async {
    final remoteMsgs = await SupabaseService.fetchChatMessages();
    if (remoteMsgs.isNotEmpty) {
      state = remoteMsgs;
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
    state = [];
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

  QuizNotifier(this.ref) : super([]);

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
  StudyTasksNotifier() : super([]);

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
