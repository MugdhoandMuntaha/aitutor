import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// Top Quick Action toolbar with cohesive, high-contrast, well-aligned action pills.
/// Replaces the stretched-out full-width buttons with a responsive, modern button group.
/// Follows Single Responsibility Principle (SRP).
class AITutorActionBar extends StatelessWidget {
  final int activeMemoryCount;
  final bool isVoiceEnabled;
  final VoidCallback onNewChat;
  final VoidCallback onOpenMemory;
  final VoidCallback onOpenHistory;
  final VoidCallback onToggleVoice;

  const AITutorActionBar({
    super.key,
    required this.activeMemoryCount,
    required this.isVoiceEnabled,
    required this.onNewChat,
    required this.onOpenMemory,
    required this.onOpenHistory,
    required this.onToggleVoice,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          // 1. + New Chat Pill (Primary Solid Button)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onNewChat,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primaryIndigo, Color(0xFF4F46E5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryIndigo.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add_rounded, size: 16, color: Colors.white),
                    SizedBox(width: 6),
                    Text(
                      "New Chat",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // 2. AI Memory Pill (Cyan Accent with Badge)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onOpenMemory,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppTheme.accentCyan.withValues(alpha: 0.5),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accentCyan.withValues(alpha: 0.12),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.psychology_rounded, size: 16, color: AppTheme.accentCyan),
                    const SizedBox(width: 6),
                    Text(
                      "Memory",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: AppTheme.accentCyan.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "$activeMemoryCount",
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.accentCyan,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // 3. Threads / History Pill
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onOpenHistory,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark
                        ? AppTheme.darkCardBorder
                        : AppTheme.lightCardBorder.withValues(alpha: 0.8),
                    width: 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.history_rounded,
                      size: 16,
                      color: isDark ? Colors.white70 : AppTheme.lightTextSecondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      "Chat History",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // 4. Voice Audio Toggle Pill
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onToggleVoice,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isVoiceEnabled
                      ? AppTheme.accentEmerald.withValues(alpha: 0.15)
                      : (isDark ? AppTheme.darkCard : Colors.white),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isVoiceEnabled
                        ? AppTheme.accentEmerald
                        : (isDark
                            ? AppTheme.darkCardBorder
                            : AppTheme.lightCardBorder.withValues(alpha: 0.8)),
                    width: isVoiceEnabled ? 1.4 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isVoiceEnabled ? Icons.volume_up_rounded : Icons.volume_off_rounded,
                      size: 16,
                      color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isVoiceEnabled ? "Voice On" : "Voice Off",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isVoiceEnabled
                            ? AppTheme.accentEmerald
                            : (isDark ? Colors.white60 : AppTheme.lightTextSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
