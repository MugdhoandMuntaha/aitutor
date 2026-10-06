import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/chat_session_model.dart';
import '../../../../shared/models/course_model.dart';

/// Top AppBar header for AI Tutor.
/// Follows Single Responsibility Principle (SRP).
class AITutorHeader extends StatelessWidget implements PreferredSizeWidget {
  final ChatSessionModel? activeSession;
  final CourseModel? selectedCourse;
  final int activeMemoryCount;
  final bool isVoiceEnabled;
  final VoidCallback onNewChat;
  final VoidCallback onOpenHistory;
  final VoidCallback onOpenMemory;
  final VoidCallback onToggleVoice;

  const AITutorHeader({
    super.key,
    required this.activeSession,
    required this.selectedCourse,
    required this.activeMemoryCount,
    required this.isVoiceEnabled,
    required this.onNewChat,
    required this.onOpenHistory,
    required this.onOpenMemory,
    required this.onToggleVoice,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppBar(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryIndigo, AppTheme.accentPurple],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryIndigo.withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  activeSession != null ? activeSession!.title : "AI Academic Tutor",
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  selectedCourse == null
                      ? "All Knowledge Bases • $activeMemoryCount Memories Active"
                      : "Course: ${selectedCourse!.code} (${selectedCourse!.title}) • $activeMemoryCount Memories",
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white60 : AppTheme.lightTextSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        // 1. + New Chat Quick Button
        IconButton(
          icon: const Icon(Icons.add_comment_rounded, color: AppTheme.primaryIndigo),
          tooltip: "Start Fresh Chat Session",
          onPressed: onNewChat,
        ),

        // 2. Chat Threads / History Button
        IconButton(
          icon: Icon(
            Icons.forum_outlined,
            color: isDark ? Colors.white70 : AppTheme.lightTextSecondary,
          ),
          tooltip: "Chat History Threads",
          onPressed: onOpenHistory,
        ),

        // 3. AI Memory Button with Count Badge
        IconButton(
          icon: Badge(
            label: Text(
              "$activeMemoryCount",
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
            ),
            backgroundColor: AppTheme.accentCyan,
            textColor: Colors.black,
            child: const Icon(Icons.psychology_rounded, color: AppTheme.accentCyan),
          ),
          tooltip: "AI Memory & Saved Preferences",
          onPressed: onOpenMemory,
        ),

        // 4. Voice Speech Toggle Button
        IconButton(
          icon: Icon(
            isVoiceEnabled ? Icons.volume_up_rounded : Icons.volume_off_rounded,
            color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
          ),
          tooltip: isVoiceEnabled ? "Voice Output Active (Tap to Mute)" : "Voice Muted (Tap to Enable)",
          onPressed: onToggleVoice,
        ),
      ],
    );
  }
}
