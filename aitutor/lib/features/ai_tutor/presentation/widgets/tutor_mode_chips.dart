import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/tutor_mode.dart';

/// Interactive chips for selecting the AI Tutor pedagogy mode.
/// Follows Open/Closed Principle (OCP) and Single Responsibility Principle (SRP).
/// Guarantees high-contrast, fully visible typography and rich iconography in both light and dark themes.
class TutorModeChips extends StatelessWidget {
  final String currentModeId;
  final ValueChanged<String> onModeChanged;

  const TutorModeChips({
    super.key,
    required this.currentModeId,
    required this.onModeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: TutorMode.allModes.map((mode) {
          final isSelected = mode.id == currentModeId;
          final accent = mode.accentColor;

          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Tooltip(
              message: mode.description,
              waitDuration: const Duration(milliseconds: 400),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: accent.withValues(alpha: 0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: Material(
                  color: isSelected
                      ? accent
                      : (isDark ? AppTheme.darkCard : Colors.white),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: isSelected
                          ? accent
                          : (isDark
                              ? AppTheme.darkCardBorder
                              : AppTheme.lightCardBorder.withValues(alpha: 0.8)),
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: InkWell(
                    onTap: () => onModeChanged(mode.id),
                    borderRadius: BorderRadius.circular(14),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            mode.icon,
                            size: 16,
                            color: isSelected ? Colors.white : accent,
                          ),
                          const SizedBox(width: 7),
                          Text(
                            mode.label,
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
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
