import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Abstract interface for Speech Recognition.
/// Follows Interface Segregation Principle (ISP), Liskov Substitution Principle (LSP),
/// and Dependency Inversion Principle (DIP).
abstract class ISpeechService {
  Future<bool> initialize();
  Future<bool> startListening({required ValueChanged<String> onResult});
  Future<void> stopListening();
  bool get isListening;
  bool get isAvailable;
  void dispose();
}

/// Concrete implementation using the speech_to_text package.
class SttSpeechService implements ISpeechService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _initialized = false;
  bool _listening = false;

  @override
  bool get isListening => _listening;

  @override
  bool get isAvailable => _initialized;

  @override
  Future<bool> initialize() async {
    if (_initialized) return true;
    try {
      _initialized = await _speech.initialize(
        onError: (err) {
          debugPrint("⚠️ Speech error: $err");
          _listening = false;
        },
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            _listening = false;
          }
        },
      );
      return _initialized;
    } catch (e) {
      debugPrint("⚠️ Speech initialize exception: $e");
      _initialized = false;
      return false;
    }
  }

  @override
  Future<bool> startListening({required ValueChanged<String> onResult}) async {
    if (!_initialized) {
      final ok = await initialize();
      if (!ok) return false;
    }

    try {
      _listening = true;
      await _speech.listen(
        onResult: (val) {
          if (val.recognizedWords.isNotEmpty) {
            onResult(val.recognizedWords);
          }
        },
      );
      return true;
    } catch (e) {
      debugPrint("⚠️ Speech start listening error: $e");
      _listening = false;
      return false;
    }
  }

  @override
  Future<void> stopListening() async {
    try {
      _listening = false;
      await _speech.stop();
    } catch (e) {
      debugPrint("⚠️ Speech stop listening error: $e");
    }
  }

  @override
  void dispose() {
    _speech.cancel();
  }
}

/// Riverpod Provider for Speech Service abstraction (DIP)
final speechServiceProvider = Provider<ISpeechService>((ref) {
  final service = SttSpeechService();
  ref.onDispose(() => service.dispose());
  return service;
});
