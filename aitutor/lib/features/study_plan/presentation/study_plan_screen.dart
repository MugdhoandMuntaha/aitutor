import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/study_task_model.dart';

class StudyPlanScreen extends ConsumerWidget {
  const StudyPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(studyTasksProvider);

    final todayTasks = tasks.where((t) => t.dayGroup == 'Today').toList();
    final tomorrowTasks = tasks.where((t) => t.dayGroup == 'Tomorrow').toList();
    final upcomingTasks = tasks.where((t) => t.dayGroup == 'Upcoming').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Personalized AI Study Plan"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_task),
            tooltip: "Add Study Session",
            onPressed: () => _showAddTaskDialog(context, ref),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Upcoming Exam Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.event_available, color: Colors.white, size: 40),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Computer Architecture Midterm", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text("Exam Date: Sept 10, 2026 • 22 Days Remaining", style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("AI Generated Daily Study Plan", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: () => _showAddTaskDialog(context, ref),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text("Add Task"),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (tasks.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.checklist_rtl, size: 48, color: Colors.grey),
                    const SizedBox(height: 12),
                    const Text("No study tasks planned.", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    ElevatedButton(
                      onPressed: () => _showAddTaskDialog(context, ref),
                      child: const Text("Create First Study Task"),
                    ),
                  ],
                ),
              ),

            if (todayTasks.isNotEmpty) ...[
              _buildDayScheduleGroup(context, ref, dayTitle: "Today (Monday)", tasks: todayTasks),
              const SizedBox(height: 16),
            ],

            if (tomorrowTasks.isNotEmpty) ...[
              _buildDayScheduleGroup(context, ref, dayTitle: "Tomorrow (Tuesday)", tasks: tomorrowTasks),
              const SizedBox(height: 16),
            ],

            if (upcomingTasks.isNotEmpty) ...[
              _buildDayScheduleGroup(context, ref, dayTitle: "Upcoming Sessions", tasks: upcomingTasks),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDayScheduleGroup(BuildContext context, WidgetRef ref, {required String dayTitle, required List<StudyTaskModel> tasks}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(dayTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.accentCyan)),
            const SizedBox(height: 12),
            ...tasks.map((task) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkBackground : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(
                      task.isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                      color: task.isCompleted ? AppTheme.accentEmerald : Colors.grey,
                    ),
                    onPressed: () {
                      ref.read(studyTasksProvider.notifier).toggleTaskCompletion(task.id);
                    },
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              task.courseTitle,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            Text(task.timeSpan, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          task.topicSubtitle,
                          style: TextStyle(
                            fontSize: 12,
                            decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert, size: 18, color: Colors.grey),
                    onSelected: (val) {
                      if (val == 'edit') {
                        _showEditTaskDialog(context, ref, task);
                      } else if (val == 'delete') {
                        ref.read(studyTasksProvider.notifier).deleteTask(task.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Task removed.")),
                        );
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'edit', child: Text("Edit Task")),
                      const PopupMenuItem(value: 'delete', child: Text("Delete Task", style: TextStyle(color: AppTheme.accentRose))),
                    ],
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  void _showAddTaskDialog(BuildContext context, WidgetRef ref) {
    final titleCtrl = TextEditingController();
    final topicCtrl = TextEditingController();
    final timeCtrl = TextEditingController(text: "07:00 - 08:00 PM");
    String selectedDay = 'Today';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text("Add Study Session Task"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedDay,
                decoration: const InputDecoration(labelText: "Day Group"),
                items: const [
                  DropdownMenuItem(value: 'Today', child: Text("Today")),
                  DropdownMenuItem(value: 'Tomorrow', child: Text("Tomorrow")),
                  DropdownMenuItem(value: 'Upcoming', child: Text("Upcoming")),
                ],
                onChanged: (val) {
                  if (val != null) setStateDialog(() => selectedDay = val);
                },
              ),
              const SizedBox(height: 10),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: "Course Title (e.g. Operating Systems)"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: topicCtrl,
                decoration: const InputDecoration(labelText: "Topic / Details"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: timeCtrl,
                decoration: const InputDecoration(labelText: "Time Window"),
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
                if (titleCtrl.text.isNotEmpty) {
                  ref.read(studyTasksProvider.notifier).addTask(
                    dayGroup: selectedDay,
                    courseTitle: titleCtrl.text.trim(),
                    topicSubtitle: topicCtrl.text.trim(),
                    timeSpan: timeCtrl.text.trim(),
                  );
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Study task added!")),
                  );
                }
              },
              child: const Text("Add"),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditTaskDialog(BuildContext context, WidgetRef ref, StudyTaskModel task) {
    final titleCtrl = TextEditingController(text: task.courseTitle);
    final topicCtrl = TextEditingController(text: task.topicSubtitle);
    final timeCtrl = TextEditingController(text: task.timeSpan);
    String selectedDay = task.dayGroup;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text("Edit Study Task"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedDay,
                decoration: const InputDecoration(labelText: "Day Group"),
                items: const [
                  DropdownMenuItem(value: 'Today', child: Text("Today")),
                  DropdownMenuItem(value: 'Tomorrow', child: Text("Tomorrow")),
                  DropdownMenuItem(value: 'Upcoming', child: Text("Upcoming")),
                ],
                onChanged: (val) {
                  if (val != null) setStateDialog(() => selectedDay = val);
                },
              ),
              const SizedBox(height: 10),
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: "Course Title"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: topicCtrl,
                decoration: const InputDecoration(labelText: "Topic / Details"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: timeCtrl,
                decoration: const InputDecoration(labelText: "Time Window"),
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
                if (titleCtrl.text.isNotEmpty) {
                  final updated = task.copyWith(
                    dayGroup: selectedDay,
                    courseTitle: titleCtrl.text.trim(),
                    topicSubtitle: topicCtrl.text.trim(),
                    timeSpan: timeCtrl.text.trim(),
                  );
                  ref.read(studyTasksProvider.notifier).updateTask(updated);
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Task updated!")),
                  );
                }
              },
              child: const Text("Save"),
            ),
          ],
        ),
      ),
    );
  }
}
