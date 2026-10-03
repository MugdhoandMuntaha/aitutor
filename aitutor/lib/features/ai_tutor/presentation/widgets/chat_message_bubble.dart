import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/chat_message_model.dart';
import '../../../../shared/widgets/glass_container.dart';
import 'chat_math_markdown_viewer.dart';
import 'citation_dialog.dart';

/// Single message bubble supporting user & AI tutor layouts, citations,
/// LaTeX equations, and quick actions.
/// Follows Single Responsibility Principle (SRP).
class ChatMessageBubble extends StatelessWidget {
  final ChatMessage message;
  final VoidCallback onSaveToMemory;
  final VoidCallback? onSpeak;

  const ChatMessageBubble({
    super.key,
    required this.message,
    required this.onSaveToMemory,
    this.onSpeak,
  });

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final textColor = isUser
        ? Colors.white
        : (isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A));

    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth > 800 ? screenWidth * 0.70 : screenWidth * 0.88;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // AI Avatar
          if (!isUser) ...[
            Container(
              margin: const EdgeInsets.only(top: 4, right: 10),
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryIndigo, AppTheme.accentPurple],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryIndigo.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(Icons.auto_awesome, color: Colors.white, size: 17),
              ),
            ),
          ],

          // Bubble Container
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: maxBubbleWidth),
              child: GlassContainer(
                borderRadius: 20,
                blur: 16,
                opacity: isUser ? 0.95 : (isDark ? 0.28 : 0.65),
                borderColor: isUser
                    ? AppTheme.primaryIndigo.withValues(alpha: 0.5)
                    : (isDark
                        ? AppTheme.darkCardBorder
                        : AppTheme.lightCardBorder.withValues(alpha: 0.8)),
                gradient: isUser
                    ? const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header label
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          isUser ? "You" : "AI Academic Tutor",
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                            color: isUser
                                ? Colors.white70
                                : (isDark ? AppTheme.accentCyan : AppTheme.primaryIndigo),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatTime(message.timestamp),
                          style: TextStyle(
                            fontSize: 10,
                            color: isUser
                                ? Colors.white54
                                : (isDark ? Colors.white38 : AppTheme.lightTextTertiary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Message Content (Formatted Markdown + LaTeX)
                    ChatMathMarkdownViewer(
                      rawText: message.text,
                      textColor: textColor,
                    ),

                    // Grounded Sources / Citations
                    if (!isUser && message.citations.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.black.withValues(alpha: 0.25)
                              : Colors.white.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.accentEmerald.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.verified_rounded, size: 14, color: AppTheme.accentEmerald),
                                SizedBox(width: 6),
                                Text(
                                  "Grounded in Verified Course Materials:",
                                  style: TextStyle(
                                    color: AppTheme.accentEmerald,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: message.citations.map((c) => InkWell(
                                onTap: () => CitationDialog.show(context, c),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.8),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Theme.of(context).dividerColor),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.picture_as_pdf, color: Colors.redAccent, size: 13),
                                      const SizedBox(width: 6),
                                      Text(
                                        "${c.documentTitle} (Pg ${c.pageNumber})",
                                        style: TextStyle(
                                          color: isDark ? AppTheme.accentCyan : AppTheme.primaryIndigo,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )).toList(),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 10),

                    // Actions Bar: Copy, Save to Memory, Speak
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Copy Button
                        InkWell(
                          onTap: () {
                            Clipboard.setData(ClipboardData(text: message.text));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text("Message copied to clipboard! 📋"),
                                duration: Duration(seconds: 1),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.copy_rounded,
                                  size: 13,
                                  color: isUser ? Colors.white70 : (isDark ? Colors.white60 : Colors.black54),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  "Copy",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: isUser ? Colors.white70 : (isDark ? Colors.white60 : Colors.black54),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Save to Memory Button
                        InkWell(
                          onTap: onSaveToMemory,
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isUser
                                  ? Colors.white.withValues(alpha: 0.15)
                                  : AppTheme.accentCyan.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isUser
                                    ? Colors.white30
                                    : AppTheme.accentCyan.withValues(alpha: 0.35),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.bookmark_add_rounded,
                                  size: 13,
                                  color: isUser ? Colors.white : AppTheme.accentCyan,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  "Save to Memory",
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isUser ? Colors.white : AppTheme.accentCyan,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // User Avatar
          if (isUser) ...[
            Container(
              margin: const EdgeInsets.only(top: 4, left: 10),
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? AppTheme.darkCard : const Color(0xFFE2E8F0),
                border: Border.all(color: AppTheme.primaryIndigo, width: 1.5),
              ),
              child: const Center(
                child: Icon(Icons.person_rounded, color: AppTheme.primaryIndigo, size: 18),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour > 12 ? time.hour - 12 : (time.hour == 0 ? 12 : time.hour);
    final minute = time.minute.toString().padLeft(2, '0');
    final ampm = time.hour >= 12 ? 'PM' : 'AM';
    return "$hour:$minute $ampm";
  }
}
