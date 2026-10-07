import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/app_providers.dart';
import '../domain/services/speech_service.dart';
import 'widgets/ai_memory_modal.dart';
import 'widgets/chat_history_modal.dart';
import 'widgets/ai_tutor_header.dart';
import 'widgets/ai_tutor_control_bar.dart';
import 'widgets/chat_message_list.dart';
import 'widgets/chat_input_field.dart';

/// Main screen for the AI Academic Tutor.
/// Refactored following SOLID Principles:
/// - Single Responsibility Principle (SRP): Coordinates the screen presentation.
/// - Open/Closed Principle (OCP): Works with extensible TutorMode domain models.
/// - Liskov Substitution Principle (LSP): Depends on ISpeechService abstraction.
/// - Interface Segregation Principle (ISP): Sub-widgets receive only the callbacks they need.
/// - Dependency Inversion Principle (DIP): Injected dependencies via Riverpod providers.
class AITutorScreen extends ConsumerStatefulWidget {
  const AITutorScreen({super.key});

  @override
  ConsumerState<AITutorScreen> createState() => _AITutorScreenState();
}

class _AITutorScreenState extends ConsumerState<AITutorScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isListening = false;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openChatHistoryModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ChatHistoryModal(),
    );
  }

  void _openAIMemoryModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const AIMemoryModal(),
    );
  }

  void _handleToggleListening() async {
    final speechService = ref.read(speechServiceProvider);
    if (_isListening) {
      await speechService.stopListening();
      if (mounted) setState(() => _isListening = false);
    } else {
      final success = await speechService.startListening(
        onResult: (recognized) {
          if (mounted) {
            setState(() {
              _messageController.text = recognized;
            });
          }
        },
      );
      if (mounted) setState(() => _isListening = success);
    }
  }

  void _handleSendMessage(String text) {
    if (text.trim().isEmpty) return;
    ref.read(chatProvider.notifier).sendMessage(text.trim());
    _messageController.clear();
    _scrollToBottom();
  }

  void _handleSaveToMemory(String text) {
    ref.read(aiMemoriesProvider.notifier).addMemory(text);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Saved fact/preference to AI Tutor Memory! 🧠"),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);
    final courses = ref.watch(coursesProvider);
    final selectedCourse = ref.watch(selectedCourseProvider);
    final tutorMode = ref.watch(tutorModeProvider);
    final isVoiceEnabled = ref.watch(isVoiceEnabledProvider);
    final sessionsNotifier = ref.watch(chatSessionsProvider.notifier);
    final activeSession = sessionsNotifier.activeSession;
    final memories = ref.watch(aiMemoriesProvider);
    final activeMemoriesCount = memories.where((m) => m.isEnabled).length;

    _scrollToBottom();

    return Scaffold(
      appBar: AITutorHeader(
        activeSession: activeSession,
        selectedCourse: selectedCourse,
        activeMemoryCount: activeMemoriesCount,
        isVoiceEnabled: isVoiceEnabled,
        onNewChat: () {
          sessionsNotifier.createNewSession();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Started a fresh New Chat session! 🚀"),
              duration: Duration(seconds: 1),
            ),
          );
        },
        onOpenHistory: () => _openChatHistoryModal(context),
        onOpenMemory: () => _openAIMemoryModal(context),
        onToggleVoice: () {
          final newState = !isVoiceEnabled;
          ref.read(isVoiceEnabledProvider.notifier).state = newState;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(newState ? "Voice Speech Enabled 🔊" : "Voice Speech Muted 🔇"),
              duration: const Duration(seconds: 1),
            ),
          );
        },
      ),
      body: Column(
        children: [
          // Unified Control Bar: Action pills, Course context chips, Mode selector
          AITutorControlBar(
            activeMemoryCount: activeMemoriesCount,
            isVoiceEnabled: isVoiceEnabled,
            courses: courses,
            selectedCourse: selectedCourse,
            currentTutorMode: tutorMode,
            onNewChat: () {
              sessionsNotifier.createNewSession();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Created New Chat session! 🚀"),
                  duration: Duration(seconds: 1),
                ),
              );
            },
            onOpenMemory: () => _openAIMemoryModal(context),
            onOpenHistory: () => _openChatHistoryModal(context),
            onToggleVoice: () {
              final newState = !isVoiceEnabled;
              ref.read(isVoiceEnabledProvider.notifier).state = newState;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(newState ? "Voice Speech Enabled 🔊" : "Voice Speech Muted 🔇"),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
            onCourseSelected: (c) {
              ref.read(selectedCourseProvider.notifier).state = c;
            },
            onModeChanged: (modeId) {
              ref.read(tutorModeProvider.notifier).state = modeId;
            },
          ),

          // Responsive Centered Chat Messages Feed
          Expanded(
            child: ChatMessageList(
              scrollController: _scrollController,
              messages: messages,
              onSaveToMemory: _handleSaveToMemory,
            ),
          ),

          // Responsive Floating Input Field
          ChatInputField(
            controller: _messageController,
            isListening: _isListening,
            onToggleListen: _handleToggleListening,
            onSendMessage: _handleSendMessage,
          ),
        ],
      ),
    );
  }
}
