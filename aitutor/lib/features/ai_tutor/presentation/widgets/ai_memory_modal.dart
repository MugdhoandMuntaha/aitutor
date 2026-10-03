import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../shared/models/ai_memory_model.dart';
import '../../../../shared/widgets/glass_container.dart';

class AIMemoryModal extends ConsumerWidget {
  const AIMemoryModal({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memories = ref.watch(aiMemoriesProvider);
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
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryIndigo.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.psychology, color: AppTheme.primaryIndigo, size: 22),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "AI Tutor Memory",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        "${memories.where((m) => m.isEnabled).length} Active Memories • Grounded in responses",
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),

          const Text(
            "ChatGPT & Gemini style memory: Facts, study preferences, and guidelines added here will be remembered across all your tutor chats.",
            style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
          ),
          const SizedBox(height: 16),

          // Add New Memory Action Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showAddMemoryDialog(context, ref),
              icon: const Icon(Icons.add_task, size: 18),
              label: const Text("Add New Memory / Preference"),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryIndigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Memories List
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.45,
            ),
            child: memories.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20.0),
                      child: Text("No memories added yet. Tap 'Add New Memory' to save preferences!"),
                    ),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const BouncingScrollPhysics(),
                    itemCount: memories.length,
                    itemBuilder: (context, index) {
                      final memory = memories[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: Material(
                          color: isDark ? AppTheme.darkBackground.withValues(alpha: 0.6) : const Color(0xFFF1F5F9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(
                              color: memory.isEnabled ? AppTheme.primaryIndigo.withValues(alpha: 0.4) : Theme.of(context).dividerColor,
                            ),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            leading: Switch(
                              value: memory.isEnabled,
                              activeTrackColor: AppTheme.primaryIndigo,
                              onChanged: (val) {
                                ref.read(aiMemoriesProvider.notifier).toggleMemory(memory.id);
                              },
                            ),
                            title: Text(
                              memory.content,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                decoration: memory.isEnabled ? null : TextDecoration.lineThrough,
                                color: memory.isEnabled ? null : Colors.grey,
                              ),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.grey),
                                  tooltip: "Edit Memory",
                                  onPressed: () => _showEditMemoryDialog(context, ref, memory),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                                  tooltip: "Forget Memory",
                                  onPressed: () {
                                    ref.read(aiMemoriesProvider.notifier).deleteMemory(memory.id);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text("Memory deleted.")),
                                    );
                                  },
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

  static void _showAddMemoryDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Add AI Memory Fact / Preference 🧠"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "What should the AI Tutor remember about you?",
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: "e.g. 'I prefer concise bullet point explanations with equations', or 'My Data Structures exam is on Oct 20th'",
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                ref.read(aiMemoriesProvider.notifier).addMemory(controller.text.trim());
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("New memory added to AI Tutor!")),
                );
              }
            },
            child: const Text("Save Memory"),
          ),
        ],
      ),
    );
  }

  static void _showEditMemoryDialog(BuildContext context, WidgetRef ref, AIMemoryModel memory) {
    final controller = TextEditingController(text: memory.content);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Edit AI Memory"),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(labelText: "Memory Content"),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                ref.read(aiMemoriesProvider.notifier).editMemory(memory.id, controller.text.trim());
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Memory updated!")),
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
