import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../shared/models/chat_session_model.dart';
import '../../../../shared/widgets/glass_container.dart';

class ChatHistoryModal extends ConsumerWidget {
  const ChatHistoryModal({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(chatSessionsProvider);
    final sessionsNotifier = ref.read(chatSessionsProvider.notifier);
    final activeSessionId = sessionsNotifier.activeSessionId;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassContainer(
      borderRadius: 28,
      blur: 24,
      opacity: 0.90,
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row with + New Chat Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.forum_outlined, color: AppTheme.primaryIndigo, size: 24),
                  SizedBox(width: 10),
                  Text("Chat History", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
              Row(
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      sessionsNotifier.createNewSession();
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Started a New Chat session!")),
                      );
                    },
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text("New Chat"),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryIndigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(width: 6),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Sessions List
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.50,
            ),
            child: sessions.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Text("No past chat threads found. Tap 'New Chat' to start one!"),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    itemCount: sessions.length,
                    itemBuilder: (context, index) {
                      final session = sessions[index];
                      final isActive = session.id == activeSessionId;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Material(
                          color: isActive
                              ? AppTheme.primaryIndigo.withValues(alpha: isDark ? 0.3 : 0.15)
                              : (isDark ? AppTheme.darkBackground.withValues(alpha: 0.5) : const Color(0xFFF8FAFC)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: isActive ? AppTheme.primaryIndigo : Theme.of(context).dividerColor,
                              width: isActive ? 1.5 : 1.0,
                            ),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                            onTap: () {
                              sessionsNotifier.switchSession(session.id);
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text("Switched to chat: ${session.title}")),
                              );
                            },
                            leading: Icon(
                              isActive ? Icons.chat_bubble : Icons.chat_bubble_outline,
                              color: isActive ? AppTheme.primaryIndigo : Colors.grey,
                              size: 20,
                            ),
                            title: Text(
                              session.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(
                              "${session.messages.length} messages • ${_formatDate(session.updatedAt)}",
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                            ),
                            trailing: PopupMenuButton<String>(
                              icon: const Icon(Icons.more_vert, size: 18, color: Colors.grey),
                              onSelected: (val) {
                                if (val == 'rename') {
                                  _showRenameSessionDialog(context, sessionsNotifier, session);
                                } else if (val == 'delete') {
                                  sessionsNotifier.deleteSession(session.id);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text("Chat session deleted.")),
                                  );
                                }
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'rename',
                                  child: Row(
                                    children: [
                                      Icon(Icons.edit, size: 16),
                                      SizedBox(width: 8),
                                      Text("Rename Chat"),
                                    ],
                                  ),
                                ),
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Row(
                                    children: [
                                      Icon(Icons.delete, size: 16, color: AppTheme.accentRose),
                                      SizedBox(width: 8),
                                      Text("Delete Chat", style: TextStyle(color: AppTheme.accentRose)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  static String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return "Just now";
    if (diff.inHours < 1) return "${diff.inMinutes}m ago";
    if (diff.inHours < 24) return "${diff.inHours}h ago";
    return "${dt.month}/${dt.day}";
  }

  static void _showRenameSessionDialog(BuildContext context, ChatSessionsNotifier notifier, ChatSessionModel session) {
    final controller = TextEditingController(text: session.title);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Rename Chat Thread"),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: "Chat Title"),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                notifier.renameSession(session.id, controller.text.trim());
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Chat title updated!")),
                );
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }
}
