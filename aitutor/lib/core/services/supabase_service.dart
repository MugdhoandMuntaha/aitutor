import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../config/env_config.dart';
import '../../shared/models/course_model.dart';
import '../../shared/models/document_model.dart';
import '../../shared/models/user_profile_model.dart';
import '../../shared/models/chat_message_model.dart';

class SupabaseService {
  static bool _isInitialized = false;

  static String toValidUuid(String rawId) {
    if (RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(rawId)) {
      return rawId;
    }
    if (rawId == 'c1') return '550e8400-e29b-41d4-a716-446655440001';
    if (rawId == 'c2') return '550e8400-e29b-41d4-a716-446655440002';
    if (rawId == 'c3') return '550e8400-e29b-41d4-a716-446655440003';
    if (rawId == 'd1') return '550e8400-e29b-41d4-a716-446655440011';
    if (rawId == 'd2') return '550e8400-e29b-41d4-a716-446655440012';
    if (rawId == 'm1') return '550e8400-e29b-41d4-a716-446655440021';
    if (rawId == 'u1') return '550e8400-e29b-41d4-a716-446655440000';
    return const Uuid().v4();
  }

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
        debugPrint("✅ Supabase initialized successfully: $url");
      } else {
        debugPrint("⚠️ Supabase credentials empty or invalid URL.");
      }
    } catch (e) {
      debugPrint("❌ Supabase init error: $e");
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
      debugPrint("❌ Supabase fetchCourses error: $e");
      return [];
    }
  }

  static Future<void> saveCourse(CourseModel course) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(course.id);
      await client.from('courses').upsert({
        'id': validId,
        'title': course.title,
        'code': course.code,
        'semester': course.semester,
        'color_hex': course.colorHex,
      });
      debugPrint("✅ Saved course $validId to Supabase");
    } catch (e) {
      debugPrint("❌ Supabase saveCourse error: $e");
    }
  }

  static Future<void> deleteCourse(String id) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(id);
      await client.from('courses').delete().eq('id', validId);
      debugPrint("✅ Deleted course $validId from Supabase");
    } catch (e) {
      debugPrint("❌ Supabase deleteCourse error: $e");
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
      debugPrint("❌ Supabase fetchDocuments error: $e");
      return [];
    }
  }

  static Future<void> saveDocument(DocumentModel doc) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(doc.id);
      final validCourseId = toValidUuid(doc.courseId);
      await client.from('documents').upsert({
        'id': validId,
        'course_id': validCourseId,
        'title': doc.title,
        'file_type': doc.fileType,
        'page_count': doc.pageCount,
        'chunk_count': doc.chunkCount,
        if (doc.fullContent != null) 'full_content': doc.fullContent,
      });
      debugPrint("✅ Saved document $validId to Supabase");
    } catch (e) {
      debugPrint("❌ Supabase saveDocument error: $e");
    }
  }

  static Future<void> deleteDocument(String id) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(id);
      await client.from('documents').delete().eq('id', validId);
      debugPrint("✅ Deleted document $validId from Supabase");
    } catch (e) {
      debugPrint("❌ Supabase deleteDocument error: $e");
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
      final validId = toValidUuid(id);
      final validDocId = toValidUuid(documentId);
      final validCourseId = toValidUuid(courseId);
      await client.from('document_chunks').upsert({
        'id': validId,
        'document_id': validDocId,
        'course_id': validCourseId,
        'content': content,
        'page_number': pageNumber,
        'chunk_index': chunkIndex,
        if (embedding != null && embedding.isNotEmpty) 'embedding': embedding,
      });
      debugPrint("✅ Saved chunk $validId to Supabase");
    } catch (e) {
      debugPrint("❌ Supabase saveChunk error: $e");
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
          fullName: response['full_name'] ?? 'Student User',
          email: response['email'] ?? '',
          university: response['university'] ?? '',
          major: response['major'] ?? '',
          academicYear: response['academic_year'] ?? '',
          avatarPath: response['avatar_url'],
          avatarPreset: response['avatar_preset'] ?? 'scholar',
          streakDays: response['streak_days'] ?? 0,
          dailyGoalMinutes: response['daily_goal_minutes'] ?? 60,
          todayStudyMinutes: response['today_study_minutes'] ?? 0,
        );
      }
    } catch (e) {
      debugPrint("❌ Supabase fetchUserProfile error: $e");
    }
    return null;
  }

  static Future<void> saveUserProfile(UserProfileModel profile) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(profile.id);
      await client.from('user_profiles').upsert({
        'id': validId,
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
      debugPrint("✅ Saved user profile to Supabase");
    } catch (e) {
      debugPrint("❌ Supabase saveUserProfile error: $e");
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
      debugPrint("❌ Supabase fetchChatMessages error: $e");
      return [];
    }
  }

  static Future<void> saveChatMessage(ChatMessage msg) async {
    if (!isReady) return;
    try {
      final validId = toValidUuid(msg.id);
      await client.from('chat_messages').upsert({
        'id': validId,
        'role': msg.role,
        'content': msg.text,
        'citations': msg.citations.map((c) => c.toJson()).toList(),
      });
      debugPrint("✅ Saved chat message $validId to Supabase");
    } catch (e) {
      debugPrint("❌ Supabase saveChatMessage error: $e");
    }
  }
}
