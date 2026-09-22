import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

/// Represents an AI Tutor teaching persona / pedagogy mode.
/// Follows Open/Closed Principle (OCP): New modes can be added without modifying UI widgets.
class TutorMode {
  final String id;
  final String label;
  final String shortLabel;
  final String description;
  final IconData icon;
  final Color accentColor;

  const TutorMode({
    required this.id,
    required this.label,
    required this.shortLabel,
    required this.description,
    required this.icon,
    required this.accentColor,
  });

  /// Standard Direct Academic Tutor mode
  static const TutorMode direct = TutorMode(
    id: 'direct',
    label: 'Direct Tutor',
    shortLabel: 'Direct',
    description: 'Direct, comprehensive academic explanations grounded in course slides & textbooks.',
    icon: Icons.bolt_rounded,
    accentColor: AppTheme.primaryIndigo,
  );

  /// Socratic Questioning & Critical Thinking mode
  static const TutorMode socratic = TutorMode(
    id: 'socratic',
    label: 'Socratic Mode',
    shortLabel: 'Socratic',
    description: 'Guides you with targeted probing questions to develop problem-solving intuition.',
    icon: Icons.psychology_rounded,
    accentColor: AppTheme.accentPurple,
  );

  /// Beginner / ELI5 mode
  static const TutorMode beginner = TutorMode(
    id: 'beginner',
    label: 'Beginner Mode',
    shortLabel: 'Beginner',
    description: 'Simplifies difficult concepts using real-world analogies, visuals & step-by-step breakdowns.',
    icon: Icons.child_care_rounded,
    accentColor: AppTheme.accentEmerald,
  );

  /// Rigorous Exam & Quiz Simulation mode
  static const TutorMode exam = TutorMode(
    id: 'exam',
    label: 'Exam Mode',
    shortLabel: 'Exam Prep',
    description: 'Challenges you with exam-level practice questions, rubric criteria & time management tips.',
    icon: Icons.quiz_rounded,
    accentColor: AppTheme.accentAmber,
  );

  /// List of all available teaching modes
  static const List<TutorMode> allModes = [
    direct,
    socratic,
    beginner,
    exam,
  ];

  /// Find mode by id, falling back to direct tutor
  static TutorMode fromId(String id) {
    return allModes.firstWhere(
      (m) => m.id == id,
      orElse: () => direct,
    );
  }
}
