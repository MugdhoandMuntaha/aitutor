import 'package:flutter/material.dart';
import '../../../../shared/models/chat_message_model.dart';
import 'chat_message_bubble.dart';

/// Scrollable message feed with responsive max-width centering.
/// Follows Single Responsibility Principle (SRP).
class ChatMessageList extends StatelessWidget {
  final ScrollController scrollController;
  final List<ChatMessage> messages;
  final ValueChanged<String> onSaveToMemory;

  const ChatMessageList({
    super.key,
    required this.scrollController,
    required this.messages,
    required this.onSaveToMemory,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 960),
        child: ListView.builder(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          physics: const BouncingScrollPhysics(),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final msg = messages[index];
            return ChatMessageBubble(
              message: msg,
              onSaveToMemory: () => onSaveToMemory(msg.text),
            );
          },
        ),
      ),
    );
  }
}
