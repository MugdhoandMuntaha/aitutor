import 'package:flutter/material.dart';
import '../../../../shared/models/course_model.dart';
import 'ai_tutor_action_bar.dart';
import 'course_filter_chips.dart';
import 'tutor_mode_chips.dart';

/// Cohesive control toolbar containing quick action pills, course filters,
/// and tutor pedagogy mode chips.
/// Follows Single Responsibility Principle (SRP) and Open/Closed Principle (OCP).
class AITutorControlBar extends StatelessWidget {
  final int activeMemoryCount;
  final bool isVoiceEnabled;
  final List<CourseModel> courses;
  final CourseModel? selectedCourse;
  final String currentTutorMode;
  final VoidCallback onNewChat;
  final VoidCallback onOpenMemory;
  final VoidCallback onOpenHistory;
  final VoidCallback onToggleVoice;
  final ValueChanged<CourseModel?> onCourseSelected;
  final ValueChanged<String> onModeChanged;

  const AITutorControlBar({
    super.key,
    required this.activeMemoryCount,
    required this.isVoiceEnabled,
    required this.courses,
    required this.selectedCourse,
    required this.currentTutorMode,
    required this.onNewChat,
    required this.onOpenMemory,
    required this.onOpenHistory,
    required this.onToggleVoice,
    required this.onCourseSelected,
    required this.onModeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 960),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 1. Quick Actions Row (New Chat, Memory, History, Voice)
            AITutorActionBar(
              activeMemoryCount: activeMemoryCount,
              isVoiceEnabled: isVoiceEnabled,
              onNewChat: onNewChat,
              onOpenMemory: onOpenMemory,
              onOpenHistory: onOpenHistory,
              onToggleVoice: onToggleVoice,
            ),

            const SizedBox(height: 2),

            // 2. Course Context Filters
            CourseFilterChips(
              courses: courses,
              selectedCourse: selectedCourse,
              onCourseSelected: onCourseSelected,
            ),

            const SizedBox(height: 2),

            // 3. Tutor Mode Persona Chips
            TutorModeChips(
              currentModeId: currentTutorMode,
              onModeChanged: onModeChanged,
            ),

            const SizedBox(height: 6),
            Divider(height: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
          ],
        ),
      ),
    );
  }
}
