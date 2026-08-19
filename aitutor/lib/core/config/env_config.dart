import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static const String _defaultSupabaseUrl = 'https://yvbwiovtkiewtwylbows.supabase.co';
  static const String _defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Yndpb3Z0a2lld3R3eWxib3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTA2MTcsImV4cCI6MjEwMjcyNjYxN30.ZCaob7sI4ZSB6XVWzjCOmKy1rQE3lm-HyMkyUOUUszk';
  static const String _defaultGeminiApiKey = 'AQ.Ab8RN6JtTU6rzDpHqwx25JSdWiEbXODZQ-Ffy2Am6diRcr3l1w';
  static const String _defaultGroqApiKey = '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';
  static const String _defaultElevenlabsApiKey = 'sk_278d6fdc870357c6512a2a0b977154617ecada8534fd60d4';

  static String get geminiApiKey {
    final val = dotenv.env['GEMINI_API_KEY'];
    return (val != null && val.isNotEmpty) ? val : _defaultGeminiApiKey;
  }

  static String get groqApiKey {
    final val = dotenv.env['GROQ_API_KEY'];
    return (val != null && val.isNotEmpty) ? val : _defaultGroqApiKey;
  }

  static String get elevenlabsApiKey {
    final val = dotenv.env['ELEVENLABS_API_KEY'];
    return (val != null && val.isNotEmpty) ? val : _defaultElevenlabsApiKey;
  }

  static String get supabaseUrl {
    final val = dotenv.env['SUPABASE_URL'];
    return (val != null && val.isNotEmpty) ? val : _defaultSupabaseUrl;
  }

  static String get supabaseAnonKey {
    final val1 = dotenv.env['SUPABSE_ANON_KEY'];
    if (val1 != null && val1.isNotEmpty) return val1;
    final val2 = dotenv.env['SUPABASE_ANON_KEY'];
    if (val2 != null && val2.isNotEmpty) return val2;
    return _defaultSupabaseAnonKey;
  }

  // Cloudflare R2 Storage Configurations
  static String get r2AccountId => dotenv.env['CLOUDFLARE_R2_ACCOUNT_ID'] ?? '';
  static String get r2AccessKeyId => dotenv.env['CLOUDFLARE_R2_ACCESS_KEY_ID'] ?? '';
  static String get r2SecretAccessKey => dotenv.env['CLOUDFLARE_R2_SECRET_ACCESS_KEY'] ?? '';
  static String get r2BucketName => dotenv.env['CLOUDFLARE_R2_BUCKET_NAME'] ?? 'aitutor-storage';
  static String get r2PublicUrl => dotenv.env['CLOUDFLARE_R2_PUBLIC_URL'] ?? '';

  static Future<void> init() async {
    try {
      await dotenv.load(fileName: ".env");
    } catch (e) {
      // Fallback to defaults
    }
  }
}
