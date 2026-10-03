import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_math_fork/flutter_math.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/chat_message_model.dart';
import '../../../shared/widgets/glass_container.dart';
import 'widgets/ai_memory_modal.dart';
import 'widgets/chat_history_modal.dart';

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

    _scrollToBottom();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppTheme.primaryIndigo,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activeSession != null ? activeSession.title : "AI Academic Tutor",
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    selectedCourse == null ? "All Knowledge Bases • ${memories.where((m) => m.isEnabled).length} Memories Active" : "Context: ${selectedCourse.code}",
                    style: TextStyle(fontSize: 11, color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black54),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // 1. + New Chat Button (ChatGPT / Gemini style)
          IconButton(
            icon: const Icon(Icons.add_comment_outlined, color: AppTheme.primaryIndigo),
            tooltip: "Start New Chat",
            onPressed: () {
              ref.read(chatSessionsProvider.notifier).createNewSession();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("Started a fresh New Chat session!"), duration: Duration(seconds: 1)),
              );
            },
          ),

          // 2. Chat History Threads Button
          IconButton(
            icon: const Icon(Icons.forum_outlined),
            tooltip: "Chat History Threads",
            onPressed: () => _openChatHistoryModal(context),
          ),

          // 3. AI Memory Button (ChatGPT & Gemini style memory)
          IconButton(
            icon: Badge(
              label: Text("${memories.where((m) => m.isEnabled).length}"),
              backgroundColor: AppTheme.accentCyan,
              child: const Icon(Icons.psychology_outlined, color: AppTheme.accentCyan),
            ),
            tooltip: "AI Memory & Preferences",
            onPressed: () => _openAIMemoryModal(context),
          ),

          // 4. Voice Audio Toggle
          IconButton(
            icon: Icon(
              isVoiceEnabled ? Icons.volume_up : Icons.volume_off,
              color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
            ),
            tooltip: "Voice Speech Output",
            onPressed: () {
              ref.read(isVoiceEnabledProvider.notifier).state = !isVoiceEnabled;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(isVoiceEnabled ? "Voice Muted" : "ElevenLabs Voice Enabled")),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Top Quick Actions Bar: New Chat & Memory Pills
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      ref.read(chatSessionsProvider.notifier).createNewSession();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Created New Chat session!"), duration: Duration(seconds: 1)),
                      );
                    },
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text("+ New Chat", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openAIMemoryModal(context),
                    icon: const Icon(Icons.psychology, size: 16, color: AppTheme.accentCyan),
                    label: Text("🧠 Memory (${memories.where((m) => m.isEnabled).length})", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.history, size: 20),
                  tooltip: "Chat History",
                  onPressed: () => _openChatHistoryModal(context),
                ),
              ],
            ),
          ),

          // Course Selector Chips
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
            child: ListView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
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

          // Tutor Mode Selector Chips
          Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
            child: ListView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
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
              physics: const BouncingScrollPhysics(),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _buildGlassMessageBubble(msg);
              },
            ),
          ),

          // Input Box (Glassmorphic Container pinned above navigation bar)
          Builder(
            builder: (context) {
              final bottomPadding = MediaQuery.of(context).padding.bottom + 20;
              return Padding(
                padding: EdgeInsets.fromLTRB(12, 6, 12, bottomPadding),
                child: GlassContainer(
                  borderRadius: 24,
                  blur: 20,
                  opacity: 0.18,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                            hintText: "Ask anything from your materials or memory...",
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
                      Container(
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryIndigo,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                          onPressed: () {
                            if (_messageController.text.trim().isNotEmpty) {
                              ref.read(chatProvider.notifier).sendMessage(_messageController.text.trim());
                              _messageController.clear();
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
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

  Widget _buildGlassMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final textColor = isUser 
        ? Colors.white 
        : (isDark ? const Color(0xFFF1F5F9) : const Color(0xFF1E293B));

    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth > 800 ? screenWidth * 0.75 : screenWidth * 0.85;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        constraints: BoxConstraints(maxWidth: maxBubbleWidth),
        child: GlassContainer(
          borderRadius: 20,
          blur: 16,
          opacity: isUser ? 0.85 : 0.18,
          gradient: isUser
              ? const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                )
              : null,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFormattedMessageContent(context, msg.text, textColor),

              const SizedBox(height: 8),

              // Action Toolbar on Messages (Save to Memory)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  InkWell(
                    onTap: () {
                      ref.read(aiMemoriesProvider.notifier).addMemory(msg.text);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Saved fact/preference to AI Tutor Memory! 🧠")),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bookmark_add_outlined, size: 13, color: isUser ? Colors.white70 : AppTheme.accentCyan),
                          const SizedBox(width: 4),
                          Text(
                            "Save to Memory",
                            style: TextStyle(fontSize: 10, color: isUser ? Colors.white70 : AppTheme.accentCyan, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              if (!isUser && msg.citations.isNotEmpty) ...[
                const SizedBox(height: 10),
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
                      color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.5),
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

  Widget _buildFormattedMessageContent(BuildContext context, String rawText, Color textColor) {
    final RegExp blockEqRegex = RegExp(r'(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])');
    final matches = blockEqRegex.allMatches(rawText);

    if (matches.isEmpty) {
      return _buildMarkdownSegment(context, rawText, textColor);
    }

    final List<Widget> children = [];
    int lastIndex = 0;

    for (final match in matches) {
      if (match.start > lastIndex) {
        final textSegment = rawText.substring(lastIndex, match.start);
        if (textSegment.trim().isNotEmpty) {
          children.add(_buildMarkdownSegment(context, textSegment, textColor));
        }
      }

      String eqRaw = match.group(0)!;
      String texCode = eqRaw;
      if (texCode.startsWith(r'$$') && texCode.endsWith(r'$$')) {
        texCode = texCode.substring(2, texCode.length - 2).trim();
      } else if (texCode.startsWith(r'\[') && texCode.endsWith(r'\]')) {
        texCode = texCode.substring(2, texCode.length - 2).trim();
      }

      // Clean $1 artifacts if any exist
      texCode = texCode.replaceAll(r'$1', '');

      children.add(
        Container(
          width: double.infinity,
          alignment: Alignment.center,
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: Colors.white,
              width: 1.2,
            ),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Math.tex(
              texCode,
              textStyle: const TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
              onErrorFallback: (err) {
                return Text(
                  texCode,
                  style: const TextStyle(color: Colors.white, fontFamily: 'monospace', fontSize: 13),
                );
              },
            ),
          ),
        ),
      );

      lastIndex = match.end;
    }

    if (lastIndex < rawText.length) {
      final remaining = rawText.substring(lastIndex);
      if (remaining.trim().isNotEmpty) {
        children.add(_buildMarkdownSegment(context, remaining, textColor));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }

  Widget _buildMarkdownSegment(BuildContext context, String text, Color textColor) {
    final cleanedText = _cleanInlineMath(text);
    return MarkdownBody(
      data: cleanedText,
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
    );
  }

  String _cleanInlineMath(String text) {
    if (text.isEmpty) return text;
    String s = text;

    // Convert single inline dollar math $eq$ into bold/clean notation
    s = s.replaceAllMapped(RegExp(r'\$([^$\n]+)\$'), (m) {
      String eq = m.group(1)?.trim() ?? '';
      return '**${_cleanSimpleMath(eq)}**';
    });

    // Convert \(eq\) into bold/clean notation
    s = s.replaceAllMapped(RegExp(r'\\\((.*?)\\\)'), (m) {
      String eq = m.group(1)?.trim() ?? '';
      return '**${_cleanSimpleMath(eq)}**';
    });

    return s;
  }

  String _cleanSimpleMath(String eq) {
    String s = eq;
    s = s.replaceAll(r'\to', '→');
    s = s.replaceAll(r'\rightarrow', '→');
    s = s.replaceAll(r'\approx', '≈');
    s = s.replaceAll(r'\infty', '∞');
    s = s.replaceAll(r'\times', '×');
    s = s.replaceAll(r'\cdot', '·');
    s = s.replaceAll(r'\le', '≤');
    s = s.replaceAll(r'\ge', '≥');
    s = s.replaceAll(r'\neq', '≠');
    s = s.replaceAll(r'\_', '_');
    s = s.replaceAllMapped(RegExp(r'\\text\s*\{([^}]+)\}'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\\([a-zA-Z]+)'), (m) => m.group(1) ?? '');
    return s.replaceAll('{', '').replaceAll('}', '').trim();
  }
}
