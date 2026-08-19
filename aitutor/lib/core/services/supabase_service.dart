import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/env_config.dart';
import '../../shared/models/course_model.dart';
import '../../shared/models/document_model.dart';
import '../../shared/models/user_profile_model.dart';
import '../../shared/models/chat_message_model.dart';

class SupabaseService {
  static bool _isInitialized = false;

  static Future<void> init() async {
    if (_isInitialized) return;
    try {
      final url = EnvConfig.supabaseUrl;
      final anonKey = EnvConfig.supabaseAnonKey;
      if (url.isNotEmpty && anonKey.isNotEmpty && url.startsWith('http')) {
        await Supabase.initialize(
          url: url,
          anonKey: anonKey,
        );
        _isInitialized = true;
      }
    } catch (e) {
      // Offline / initialization fallback
    }
  }

  static SupabaseClient get client => Supabase.instance.client;

  static bool get isReady => _isInitialized;

  // -------------------------------------------------------------
  // Courses Persistence
  // -------------------------------------------------------------
  static Future<List<CourseModel>> fetchCourses() async {
    if (!isReady) return [];
    try {
      final response = await client.from('courses').select().order('created_at', ascending: true);
      final List<dynamic> data = response;
      return data.map((json) => CourseModel(
        id: json['id'].toString(),
        title: json['title'] ?? '',
        code: json['code'] ?? '',
        semester: json['semester'] ?? 'Fall 2026',
        colorHex: json['color_hex'] ?? '#4F46E5',
        documentCount: json['document_count'] ?? 0,
        masteryScore: json['mastery_score'] ?? 75,
      )).toList();
    } catch (e) {
      return [];
    }
  }

  static Future<void> saveCourse(CourseModel course) async {
    if (!isReady) return;
    try {
      await client.from('courses').upsert({
        'id': course.id,
        'title': course.title,
        'code': course.code,
        'semester': course.semester,
        'color_hex': course.colorHex,
      });
    } catch (e) {
      // Ignored
    }
  }

  static Future<void> deleteCourse(String id) async {
    if (!isReady) return;
    try {
      await client.from('courses').delete().eq('id', id);
    } catch (e) {
      // Ignored
    }
  }

  // -------------------------------------------------------------
  // Documents Persistence
  // -------------------------------------------------------------
  static Future<List<DocumentModel>> fetchDocuments() async {
    if (!isReady) return [];
    try {
      final response = await client.from('documents').select().order('created_at', ascending: false);
      final List<dynamic> data = response;
      return data.map((json) => DocumentModel(
        id: json['id'].toString(),
        courseId: json['course_id']?.toString() ?? '',
        title: json['title'] ?? '',
        fileType: json['file_type'] ?? 'pdf',
        pageCount: json['page_count'] ?? 1,
        chunkCount: json['chunk_count'] ?? 0,
        createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
        fullContent: json['full_content'],
      )).toList();
    } catch (e) {
      return [];
    }
  }

  static Future<void> saveDocument(DocumentModel doc) async {
    if (!isReady) return;
    try {
      await client.from('documents').upsert({
        'id': doc.id,
        'course_id': doc.courseId,
        'title': doc.title,
        'file_type': doc.fileType,
        'page_count': doc.pageCount,
        'chunk_count': doc.chunkCount,
        if (doc.fullContent != null) 'full_content': doc.fullContent,
      });
    } catch (e) {
      // Ignored
    }
  }

  static Future<void> deleteDocument(String id) async {
    if (!isReady) return;
    try {
      await client.from('documents').delete().eq('id', id);
    } catch (e) {
      // Ignored
    }
  }

  // -------------------------------------------------------------
  // Document Chunks & Vector Persistence
  // -------------------------------------------------------------
  static Future<void> saveChunk({
    required String id,
    required String documentId,
    required String courseId,
    required String content,
    required int pageNumber,
    required int chunkIndex,
    List<double>? embedding,
  }) async {
    if (!isReady) return;
    try {
      await client.from('document_chunks').upsert({
        'id': id,
        'document_id': documentId,
        'course_id': courseId,
        'content': content,
        'page_number': pageNumber,
        'chunk_index': chunkIndex,
        if (embedding != null && embedding.isNotEmpty) 'embedding': embedding,
      });
    } catch (e) {
      // Ignored
    }
  }

  // -------------------------------------------------------------
  // User Profile Persistence
  // -------------------------------------------------------------
  static Future<UserProfileModel?> fetchUserProfile() async {
    if (!isReady) return null;
    try {
      final response = await client.from('user_profiles').select().limit(1).maybeSingle();
      if (response != null) {
        return UserProfileModel(
          id: response['id'].toString(),
          fullName: response['full_name'] ?? 'Junaid',
          email: response['email'] ?? 'junaid@aitutor.edu',
          university: response['university'] ?? 'BAUST (Science & Technology)',
          major: response['major'] ?? 'Computer Science & Engineering',
          academicYear: response['academic_year'] ?? '3rd Year (Semester VI)',
          avatarPath: response['avatar_url'],
          avatarPreset: response['avatar_preset'] ?? 'scholar',
          streakDays: response['streak_days'] ?? 12,
          dailyGoalMinutes: response['daily_goal_minutes'] ?? 60,
          todayStudyMinutes: response['today_study_minutes'] ?? 45,
        );
      }
    } catch (e) {
      // Ignored
    }
    return null;
  }

  static Future<void> saveUserProfile(UserProfileModel profile) async {
    if (!isReady) return;
    try {
      await client.from('user_profiles').upsert({
        'id': profile.id,
        'full_name': profile.fullName,
        'email': profile.email,
        'university': profile.university,
        'major': profile.major,
        'academic_year': profile.academicYear,
        'avatar_url': profile.avatarPath,
        'avatar_preset': profile.avatarPreset,
        'streak_days': profile.streakDays,
        'daily_goal_minutes': profile.dailyGoalMinutes,
        'today_study_minutes': profile.todayStudyMinutes,
      });
    } catch (e) {
      // Ignored
    }
  }

  // -------------------------------------------------------------
  // Chat Messages Persistence
  // -------------------------------------------------------------
  static Future<List<ChatMessage>> fetchChatMessages() async {
    if (!isReady) return [];
    try {
      final response = await client.from('chat_messages').select().order('created_at', ascending: true);
      final List<dynamic> data = response;
      return data.map((json) {
        final List<dynamic> rawCitations = json['citations'] ?? [];
        final citations = rawCitations.map((c) => Citation(
          documentTitle: c['documentTitle'] ?? 'Course Context',
          pageNumber: c['pageNumber'] ?? 1,
          snippet: c['snippet'] ?? '',
        )).toList();

        return ChatMessage(
          id: json['id'].toString(),
          role: json['role'] ?? 'assistant',
          text: json['content'] ?? '',
          citations: citations,
          timestamp: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
        );
      }).toList();
    } catch (e) {
      return [];
    }
  }

  static Future<void> saveChatMessage(ChatMessage msg) async {
    if (!isReady) return;
    try {
      await client.from('chat_messages').upsert({
        'id': msg.id,
        'role': msg.role,
        'content': msg.text,
        'citations': msg.citations.map((c) => c.toJson()).toList(),
      });
    } catch (e) {
      // Ignored
    }
  }
}
