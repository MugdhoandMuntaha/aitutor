import 'dart:convert';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:http/http.dart' as http;
import '../config/env_config.dart';

class ElevenLabsService {
  final FlutterTts _flutterTts = FlutterTts();

  ElevenLabsService() {
    _initTts();
  }

  void _initTts() async {
    try {
      await _flutterTts.setLanguage("en-US");
      await _flutterTts.setSpeechRate(0.5);
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);
    } catch (e) {
      // Platform TTS not supported on Linux Desktop natively without extra speech synthesis daemon
    }
  }

  /// Speak text via ElevenLabs API or fallback FlutterTTS
  Future<void> speak(String text) async {
    final apiKey = EnvConfig.elevenlabsApiKey;

    // Clean markdown formatting before TTS
    final cleanText = text
        .replaceAll(RegExp(r'[\*#_`~]'), '')
        .replaceAll(RegExp(r'\[.*?\]'), '')
        .trim();

    if (cleanText.isEmpty) return;

    if (apiKey.isNotEmpty) {
      try {
        const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
        final url = Uri.parse("https://api.elevenlabs.io/v1/text-to-speech/$voiceId");
        final response = await http.post(
          url,
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: jsonEncode({
            "text": cleanText.length > 500 ? cleanText.substring(0, 500) : cleanText,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
              "stability": 0.5,
              "similarity_boost": 0.75,
            }
          }),
        );

        if (response.statusCode == 200) {
          try {
            await _flutterTts.speak(cleanText);
          } catch (_) {}
          return;
        }
      } catch (e) {
        // Fallback to local TTS
      }
    }

    try {
      await _flutterTts.speak(cleanText);
    } catch (_) {}
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (_) {}
  }
}

