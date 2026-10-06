import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/glass_container.dart';

/// Floating, responsive chat input field with voice transcription and send action.
/// Follows Single Responsibility Principle (SRP).
class ChatInputField extends StatelessWidget {
  final TextEditingController controller;
  final bool isListening;
  final VoidCallback onToggleListen;
  final ValueChanged<String> onSendMessage;

  const ChatInputField({
    super.key,
    required this.controller,
    required this.isListening,
    required this.onToggleListen,
    required this.onSendMessage,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).padding.bottom + 92;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 880),
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 6, 16, bottomPadding),
          child: GlassContainer(
            borderRadius: 24,
            blur: 24,
            opacity: isDark ? 0.35 : 0.88,
            borderColor: isDark
                ? AppTheme.primaryIndigo.withValues(alpha: 0.3)
                : AppTheme.lightCardBorder,
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryIndigo.withValues(alpha: isDark ? 0.15 : 0.08),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Microphone / Voice Input Button
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: isListening
                        ? Colors.redAccent
                        : Colors.transparent,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: Icon(
                      isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                      color: isListening ? Colors.white : AppTheme.primaryIndigo,
                      size: 22,
                    ),
                    tooltip: isListening ? "Stop Listening" : "Speak to Tutor",
                    onPressed: onToggleListen,
                  ),
                ),

                // Text Input Field
                Expanded(
                  child: ValueListenableBuilder<TextEditingValue>(
                    valueListenable: controller,
                    builder: (context, value, _) {
                      return TextField(
                        controller: controller,
                        minLines: 1,
                        maxLines: 4,
                        textInputAction: TextInputAction.send,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          hintText: isListening
                              ? "Listening to your voice..."
                              : "Ask anything from your course materials...",
                          hintStyle: TextStyle(
                            fontSize: 13,
                            color: isDark ? Colors.white38 : AppTheme.lightTextTertiary,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          filled: false,
                        ),
                        onSubmitted: (val) {
                          if (val.trim().isNotEmpty) {
                            onSendMessage(val.trim());
                            controller.clear();
                          }
                        },
                      );
                    },
                  ),
                ),

                // Send Button
                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: controller,
                  builder: (context, value, _) {
                    final hasText = value.text.trim().isNotEmpty;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: hasText
                            ? const LinearGradient(
                                colors: [AppTheme.primaryIndigo, Color(0xFF4F46E5)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              )
                            : null,
                        color: hasText
                            ? null
                            : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE2E8F0)),
                        shape: BoxShape.circle,
                        boxShadow: hasText
                            ? [
                                BoxShadow(
                                  color: AppTheme.primaryIndigo.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.send_rounded,
                          color: hasText ? Colors.white : (isDark ? Colors.white38 : Colors.black38),
                          size: 18,
                        ),
                        tooltip: "Send Question",
                        onPressed: hasText
                            ? () {
                                onSendMessage(controller.text.trim());
                                controller.clear();
                              }
                            : null,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
