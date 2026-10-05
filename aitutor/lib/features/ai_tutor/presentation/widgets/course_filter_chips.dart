import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/course_model.dart';

/// Interactive chip selector for filtering AI knowledge base context by course.
/// Follows Single Responsibility Principle (SRP).
/// Guarantees high-contrast typography and clear active state indicators.
class CourseFilterChips extends StatelessWidget {
  final List<CourseModel> courses;
  final CourseModel? selectedCourse;
  final ValueChanged<CourseModel?> onCourseSelected;

  const CourseFilterChips({
    super.key,
    required this.courses,
    required this.selectedCourse,
    required this.onCourseSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAllSelected = selectedCourse == null;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          // "All Courses" Pill
          _buildChip(
            context: context,
            label: "All Courses",
            icon: Icons.auto_stories_rounded,
            isSelected: isAllSelected,
            onTap: () => onCourseSelected(null),
            isDark: isDark,
          ),
          const SizedBox(width: 8),

          // Individual Course Pills
          ...courses.map((course) {
            final isSelected = selectedCourse?.id == course.id;
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: _buildChip(
                context: context,
                label: course.code,
                icon: Icons.book_rounded,
                isSelected: isSelected,
                onTap: () => onCourseSelected(isSelected ? null : course),
                isDark: isDark,
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildChip({
    required BuildContext context,
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: AppTheme.primaryIndigo.withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Material(
        color: isSelected
            ? AppTheme.primaryIndigo
            : (isDark ? AppTheme.darkCard : Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: isSelected
                ? AppTheme.primaryIndigo
                : (isDark
                    ? AppTheme.darkCardBorder
                    : AppTheme.lightCardBorder.withValues(alpha: 0.8)),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: 15,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? AppTheme.accentCyan : AppTheme.primaryIndigo),
                ),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? const Color(0xFFF1F5F9) : const Color(0xFF1E293B)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
