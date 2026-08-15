import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/chat_message_model.dart';

class AITutorScreen extends ConsumerStatefulWidget {
  const AITutorScreen({super.key});

  @override
  ConsumerState<AITutorScreen> createState() => _AITutorScreenState();
}

class _AITutorScreenState extends ConsumerState<AITutorScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  void _initSpeech() async {
    try {
      await _speech.initialize();
    } catch (e) {
      // Speech not available
    }
  }

  void _listen() async {
    if (!_isListening) {
      bool available = await _speech.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speech.listen(
          onResult: (val) => setState(() {
            _messageController.text = val.recognizedWords;
          }),
        );
      }
    } else {
      setState(() => _isListening = false);
      _speech.stop();
    }
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

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider);
    final courses = ref.watch(coursesProvider);
    final selectedCourse = ref.watch(selectedCourseProvider);
    final tutorMode = ref.watch(tutorModeProvider);
    final isVoiceEnabled = ref.watch(isVoiceEnabledProvider);

    _scrollToBottom();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const CircleAvatar(
              backgroundColor: AppTheme.primaryIndigo,
              radius: 14,
              child: Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("AI Academic Tutor", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  selectedCourse == null ? "Searching All Knowledge Bases" : "Active Context: ${selectedCourse.code}",
                  style: TextStyle(fontSize: 11, color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black54),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isVoiceEnabled ? Icons.volume_up : Icons.volume_off,
              color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
            ),
            tooltip: "Voice Speech Output (ElevenLabs)",
            onPressed: () {
              ref.read(isVoiceEnabledProvider.notifier).state = !isVoiceEnabled;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(isVoiceEnabled ? "Voice Output Muted" : "Voice Output Enabled (ElevenLabs AI)")),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Bar 1: Course Selector Chips
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            color: Theme.of(context).cardColor,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                FilterChip(
                  label: const Text("All Courses"),
                  selected: selectedCourse == null,
                  onSelected: (val) => ref.read(selectedCourseProvider.notifier).state = null,
                ),
                const SizedBox(width: 8),
                ...courses.map((c) => Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: FilterChip(
                    label: Text(c.code),
                    selected: selectedCourse?.id == c.id,
                    onSelected: (val) => ref.read(selectedCourseProvider.notifier).state = val ? c : null,
                  ),
                )),
              ],
            ),
          ),

          // Filter Bar 2: Tutor Mode Chips
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            color: Theme.of(context).scaffoldBackgroundColor,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildModeChip("direct", "Direct Tutor", Icons.check_circle_outline, tutorMode, ref),
                _buildModeChip("socratic", "Socratic Mode", Icons.psychology, tutorMode, ref),
                _buildModeChip("beginner", "Beginner Mode", Icons.child_care, tutorMode, ref),
                _buildModeChip("exam", "Exam Mode", Icons.quiz, tutorMode, ref),
              ],
            ),
          ),

          Divider(height: 1, color: Theme.of(context).dividerColor),

          // Chat Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _buildMessageBubble(msg);
              },
            ),
          ),

          // Input Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(_isListening ? Icons.mic : Icons.mic_none, color: _isListening ? Colors.red : AppTheme.primaryIndigo),
                  onPressed: _listen,
                ),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: "Ask anything from your study materials...",
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                    ),
                    onSubmitted: (val) {
                      if (val.trim().isNotEmpty) {
                        ref.read(chatProvider.notifier).sendMessage(val.trim());
                        _messageController.clear();
                      }
                    },
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: AppTheme.primaryIndigo),
                  onPressed: () {
                    if (_messageController.text.trim().isNotEmpty) {
                      ref.read(chatProvider.notifier).sendMessage(_messageController.text.trim());
                      _messageController.clear();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModeChip(String key, String label, IconData icon, String currentMode, WidgetRef ref) {
    final isSelected = key == currentMode;
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: ChoiceChip(
        avatar: Icon(icon, size: 14, color: isSelected ? Colors.white : Colors.grey),
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: isSelected,
        selectedColor: AppTheme.primaryIndigo,
        onSelected: (val) {
          if (val) ref.read(tutorModeProvider.notifier).state = key;
        },
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final bubbleBg = isUser 
        ? AppTheme.primaryIndigo 
        : Theme.of(context).cardColor;
        
    final textColor = isUser 
        ? Colors.white 
        : (isDark ? const Color(0xFFF1F5F9) : const Color(0xFF1E293B));

    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth > 800 ? screenWidth * 0.75 : screenWidth * 0.85;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: maxBubbleWidth),
        decoration: BoxDecoration(
          color: bubbleBg,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
            bottomLeft: !isUser ? Radius.zero : const Radius.circular(16),
          ),
          border: isUser ? null : Border.all(color: Theme.of(context).dividerColor),
          boxShadow: [
            if (!isUser)
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MarkdownBody(
              data: msg.text,
              selectable: true,
              styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
                p: TextStyle(color: textColor, fontSize: 14, height: 1.5),
                h1: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold),
                h2: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold),
                h3: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold),
                listBullet: TextStyle(color: textColor),
                tableHead: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 13),
                tableBody: TextStyle(color: textColor, fontSize: 13),
                tableBorder: TableBorder.all(
                  color: Theme.of(context).dividerColor,
                  width: 1,
                ),
                tableCellsPadding: const EdgeInsets.all(8),
              ),
            ),

            if (!isUser && msg.citations.isNotEmpty) ...[
              const SizedBox(height: 14),
              Divider(color: Theme.of(context).dividerColor),
              const Row(
                children: [
                  Icon(Icons.source, size: 13, color: AppTheme.accentEmerald),
                  SizedBox(width: 6),
                  Text("Grounded Sources:", style: TextStyle(color: AppTheme.accentEmerald, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 8),
              ...msg.citations.map((c) => InkWell(
                onTap: () {
                  _showCitationDialog(context, c);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.picture_as_pdf, color: Colors.redAccent, size: 14),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "${c.documentTitle} (Pg ${c.pageNumber})",
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Theme.of(context).primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }

  void _showCitationDialog(BuildContext context, Citation c) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.menu_book, color: AppTheme.accentEmerald),
            const SizedBox(width: 8),
            Expanded(child: Text(c.documentTitle, style: const TextStyle(fontSize: 14))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Page Reference: ${c.pageNumber}", style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentCyan)),
            const SizedBox(height: 8),
            const Text("Excerpt from Knowledge Base:", style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Text(c.snippet, style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Close"),
          ),
        ],
      ),
    );
  }
}
