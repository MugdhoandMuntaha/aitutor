import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';
import '../../core/theme/app_theme.dart';
import 'glass_container.dart';

class SamsungNowBar extends ConsumerStatefulWidget {
  final Function(int) onNavigateTab;

  const SamsungNowBar({
    super.key,
    required this.onNavigateTab,
  });

  @override
  ConsumerState<SamsungNowBar> createState() => _SamsungNowBarState();
}

class _SamsungNowBarState extends ConsumerState<SamsungNowBar> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(userProfileProvider);
    final selectedCourse = ref.watch(selectedCourseProvider);
    final isVoiceEnabled = ref.watch(isVoiceEnabledProvider);
    final progress = (profile.todayStudyMinutes / (profile.dailyGoalMinutes > 0 ? profile.dailyGoalMinutes : 60)).clamp(0.0, 1.0);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.fastOutSlowIn,
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Expanded Live Activity Sheet (Samsung One UI 7 Style)
          if (_isExpanded) ...[
            GlassContainer(
              borderRadius: 24,
              blur: 24,
              opacity: 0.25,
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppTheme.accentAmber.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.local_fire_department, color: AppTheme.accentAmber, size: 18),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Samsung Now Bar • Live Activity",
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey),
                              ),
                              Text(
                                "🔥 ${profile.streakDays} Days Study Streak!",
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.keyboard_arrow_down, size: 20),
                        onPressed: () => setState(() => _isExpanded = false),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Progress Bar for Daily Study Goal
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Daily Goal: ${profile.todayStudyMinutes} / ${profile.dailyGoalMinutes} mins",
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                      Text(
                        "${(progress * 100).round()}%",
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.accentCyan),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      color: AppTheme.accentCyan,
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Quick Controls Grid inside Expanded Now Bar
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            ref.read(userProfileProvider.notifier).incrementStudyTime(15);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Logged +15 mins to active study session!")),
                            );
                          },
                          icon: const Icon(Icons.timer_sharp, size: 16),
                          label: const Text("+15m Study", style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            setState(() => _isExpanded = false);
                            widget.onNavigateTab(2); // Jump to AI Tutor
                          },
                          icon: const Icon(Icons.psychology, size: 16),
                          label: Text(selectedCourse != null ? selectedCourse.code : "AI Tutor", style: const TextStyle(fontSize: 12)),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],

          // Pinned Compact Now Bar Pill
          GlassContainer(
            borderRadius: 30,
            blur: 20,
            opacity: 0.20,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            child: Row(
              children: [
                // Live Streak Pill (Always visible!)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF59E0B), Color(0xFFEA580C)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.orange.withValues(alpha: 0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_fire_department, color: Colors.white, size: 15),
                      const SizedBox(width: 4),
                      Text(
                        "${profile.streakDays} Days",
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 10),

                // Center Dynamic Activity Text & Mini Progress Ring
                Expanded(
                  child: Row(
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              value: progress,
                              strokeWidth: 2.5,
                              backgroundColor: Colors.white.withValues(alpha: 0.2),
                              color: AppTheme.accentCyan,
                            ),
                          ),
                          const Icon(Icons.timer_outlined, size: 12, color: Colors.white70),
                        ],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              "${profile.todayStudyMinutes}m logged today",
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? AppTheme.darkTextPrimary
                                    : AppTheme.lightTextPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              selectedCourse != null ? "Context: ${selectedCourse.code}" : "AI Companion Active",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Theme.of(context).brightness == Brightness.dark
                                    ? AppTheme.darkTextSecondary
                                    : AppTheme.lightTextSecondary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 6),

                // Voice Toggle Shortcut
                InkWell(
                  onTap: () {
                    ref.read(isVoiceEnabledProvider.notifier).state = !isVoiceEnabled;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(isVoiceEnabled ? "ElevenLabs Voice Output Muted" : "ElevenLabs Voice Output Enabled"),
                        duration: const Duration(seconds: 1),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isVoiceEnabled
                          ? AppTheme.accentEmerald.withValues(alpha: 0.25)
                          : Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isVoiceEnabled ? Icons.volume_up : Icons.volume_off,
                      size: 16,
                      color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
                    ),
                  ),
                ),

                const SizedBox(width: 4),

                // Expand Chevron Icon
                Icon(
                  _isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_up,
                  size: 18,
                  color: Colors.grey,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
