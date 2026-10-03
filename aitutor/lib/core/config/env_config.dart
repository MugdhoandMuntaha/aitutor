import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static const String _defaultSupabaseUrl = '';
  static const String _defaultSupabaseAnonKey = '';
  static const String _defaultGeminiApiKey = '';
  static const String _defaultGroqApiKey = '';
  static const String _defaultElevenlabsApiKey = '';

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
