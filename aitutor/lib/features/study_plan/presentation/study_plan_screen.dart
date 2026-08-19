import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/study_task_model.dart';
import '../../../shared/widgets/glass_container.dart';

class StudyPlanScreen extends ConsumerWidget {
  const StudyPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(studyTasksProvider);
    final courses = ref.watch(coursesProvider);
    final activeCourse = courses.isNotEmpty ? courses.first : null;

    final todayTasks = tasks.where((t) => t.dayGroup == 'Today').toList();
    final tomorrowTasks = tasks.where((t) => t.dayGroup == 'Tomorrow').toList();
    final upcomingTasks = tasks.where((t) => t.dayGroup == 'Upcoming').toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Upcoming Exam Banner (Glassmorphic)
          GlassContainer(
            borderRadius: 20,
            blur: 16,
            opacity: 0.20,
            gradient: const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.event_available, color: Colors.white, size: 36),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activeCourse != null ? "${activeCourse.title} Exam Prep" : "AI Adaptive Study Planner",
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeCourse != null
                            ? "Course Code: ${activeCourse.code} • Active Semester: ${activeCourse.semester}"
                            : "Add your courses and materials to build a personalized study plan.",
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("AI Generated Daily Study Plan", style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              TextButton.icon(
                onPressed: () => _showAddTaskDialog(context, ref),
                icon: const Icon(Icons.add, size: 18),
                label: const Text("Add Task"),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (tasks.isEmpty)
            GlassContainer(
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              borderRadius: 20,
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
    );
  }

  Widget _buildDayScheduleGroup(BuildContext context, WidgetRef ref, {required String dayTitle, required List<StudyTaskModel> tasks}) {
    return GlassContainer(
      borderRadius: 20,
      blur: 14,
      opacity: 0.15,
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
              color: Theme.of(context).brightness == Brightness.dark ? AppTheme.darkBackground.withValues(alpha: 0.5) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    task.isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: task.isCompleted ? AppTheme.accentEmerald : Colors.grey,
                  ),
                  onPressed: () {
                    final willComplete = !task.isCompleted;
                    ref.read(studyTasksProvider.notifier).toggleTaskCompletion(task.id);
                    if (willComplete) {
                      ref.read(userProfileProvider.notifier).incrementStudyTime(15);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Task completed! +15 mins logged.")),
                      );
                    }
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
                          Expanded(
                            child: Text(
                              task.courseTitle,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                              ),
                              overflow: TextOverflow.ellipsis,
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
                        overflow: TextOverflow.ellipsis,
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
                initialValue: selectedDay,
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
                initialValue: selectedDay,
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
