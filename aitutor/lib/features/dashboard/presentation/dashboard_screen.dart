import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/user_profile_model.dart';
import '../../../shared/widgets/glass_container.dart';

class DashboardScreen extends ConsumerWidget {
  final Function(int) onNavigateTab;

  const DashboardScreen({super.key, required this.onNavigateTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(userProfileProvider);
    final courses = ref.watch(coursesProvider);
    final documents = ref.watch(documentsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final avgMastery = courses.isEmpty
        ? 0
        : (courses.map((c) => c.masteryScore).reduce((a, b) => a + b) / courses.length).round();

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Dynamic Glassmorphic App Bar / Header (iOS 26 Style)
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF312E81), const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                        : [const Color(0xFF4F46E5), const Color(0xFF6366F1), const Color(0xFF06B6D4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    // Dynamic iOS Glass ambient glow blobs
                    Positioned(
                      top: -30,
                      right: -30,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.accentCyan.withValues(alpha: 0.35),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.accentCyan.withValues(alpha: 0.4),
                              blurRadius: 50,
                            ),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 10,
                      left: -20,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppTheme.accentPurple.withValues(alpha: 0.3),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.accentPurple.withValues(alpha: 0.35),
                              blurRadius: 40,
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Header Content Container
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            // Fully Responsive Header Row (Student Info + Streak)
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Avatar (Taps to Profile)
                                InkWell(
                                  onTap: () => onNavigateTab(4),
                                  borderRadius: BorderRadius.circular(24),
                                  child: _buildDashboardAvatar(profile),
                                ),
                                const SizedBox(width: 10),

                                // Student Name & Major (Wrapped in Expanded to prevent pushing streak button off screen!)
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text(
                                        "Welcome back 👋",
                                        style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        profile.fullName,
                                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                      Text(
                                        profile.major,
                                        style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 11),
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 8),

                                // 🔥 12 Days Streak Pill Widget (Guaranteed Visible & Scaled for Mobile Screens!)
                                GlassContainer(
                                  borderRadius: 20,
                                  blur: 12,
                                  opacity: 0.25,
                                  borderWidth: 1,
                                  borderColor: Colors.amber.withValues(alpha: 0.5),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  onTap: () => onNavigateTab(4),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.local_fire_department, color: Colors.amberAccent, size: 16),
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
                              ],
                            ),

                            const SizedBox(height: 14),

                            // Responsive Stat Pills Row (Horizontally Scrollable so no overflow on small phones)
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              physics: const BouncingScrollPhysics(),
                              child: Row(
                                children: [
                                  _buildStatPill(
                                    Icons.analytics,
                                    "Mastery",
                                    "$avgMastery%",
                                    onTap: () => onNavigateTab(1),
                                  ),
                                  const SizedBox(width: 8),
                                  _buildStatPill(
                                    Icons.timer,
                                    "Today",
                                    "${profile.todayStudyMinutes} mins",
                                    onTap: () => _showLogStudyTimeDialog(context, ref),
                                  ),
                                  const SizedBox(width: 8),
                                  _buildStatPill(
                                    Icons.folder_open,
                                    "Courses",
                                    "${courses.length}",
                                    onTap: () => onNavigateTab(1),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Main Body Content (iOS 26 Glassmorphic Cards)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section Header: Quick Actions
                  const Text(
                    "Quick Actions",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
                  ),
                  const SizedBox(height: 12),

                  // Responsive Glassmorphic Action Cards Grid
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final crossCount = constraints.maxWidth > 600 ? 4 : 2;
                      return GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: crossCount,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: constraints.maxWidth > 600 ? 1.5 : 1.35,
                        children: [
                          _buildSolidActionCard(
                            context,
                            title: "AI Tutor Chat",
                            subtitle: "Ask RAG Grounded Qs",
                            icon: Icons.psychology,
                            color: const Color(0xFF9395D3),
                            onTap: () => onNavigateTab(2),
                          ),
                          _buildSolidActionCard(
                            context,
                            title: "Upload Materials",
                            subtitle: "PDFs, Slides & Notes",
                            icon: Icons.upload_file,
                            color: const Color(0xFF76B09D),
                            onTap: () => onNavigateTab(1),
                          ),
                          _buildSolidActionCard(
                            context,
                            title: "AI Quiz Generator",
                            subtitle: "Test Knowledge",
                            icon: Icons.quiz,
                            color: const Color(0xFFD9B28F),
                            onTap: () => onNavigateTab(3),
                          ),
                          _buildSolidActionCard(
                            context,
                            title: "Study Schedule",
                            subtitle: "Adaptive Exam Planner",
                            icon: Icons.calendar_today,
                            color: const Color(0xFFDF8CB1),
                            onTap: () => onNavigateTab(3),
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 20),

                  // Weak Topics Alert Card (Glassmorphic)
                  GlassContainer(
                    borderRadius: 20,
                    blur: 16,
                    opacity: 0.15,
                    borderColor: avgMastery < 70
                        ? AppTheme.accentRose.withValues(alpha: 0.4)
                        : AppTheme.accentEmerald.withValues(alpha: 0.4),
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: (avgMastery < 70 ? AppTheme.accentRose : AppTheme.accentEmerald).withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            avgMastery < 70 ? Icons.warning_amber_rounded : Icons.workspace_premium,
                            color: avgMastery < 70 ? AppTheme.accentRose : AppTheme.accentEmerald,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                avgMastery < 70 ? "Weak Topics Recommendation" : "Mastery Progress",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: avgMastery < 70 ? AppTheme.accentRose : AppTheme.accentEmerald,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                avgMastery < 70
                                    ? "Average mastery is $avgMastery%. Take a 5-min revision quiz to improve weak topics."
                                    : "Great progress! Overall course mastery is $avgMastery%. Keep it up!",
                                style: TextStyle(
                                  color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () => onNavigateTab(3),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: avgMastery < 70 ? AppTheme.accentRose : AppTheme.accentEmerald,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(avgMastery < 70 ? "Revise" : "Quiz", style: const TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Course Knowledge Bases Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Course Knowledge Bases",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
                      ),
                      TextButton(
                        onPressed: () => onNavigateTab(1),
                        child: const Text("View All"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Courses Glass Horizontal ListView
                  if (courses.isEmpty)
                    GlassContainer(
                      padding: const EdgeInsets.all(20),
                      width: double.infinity,
                      child: const Center(
                        child: Text("No courses added yet. Tap 'View All' to create a course!"),
                      ),
                    )
                  else
                    SizedBox(
                      height: 140,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: courses.length,
                        itemBuilder: (context, index) {
                          final course = courses[index];
                          return _buildGlassCourseCard(context, ref, course);
                        },
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Recent Uploaded Documents Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Recent Course Materials",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
                      ),
                      TextButton(
                        onPressed: () => onNavigateTab(1),
                        child: const Text("Upload"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (documents.isEmpty)
                    GlassContainer(
                      padding: const EdgeInsets.all(20),
                      width: double.infinity,
                      child: const Center(
                        child: Text("No materials uploaded yet. Tap 'Upload' to add PDF slides or notes!"),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: documents.length,
                      itemBuilder: (context, index) {
                        final doc = documents[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: GlassContainer(
                            borderRadius: 16,
                            blur: 12,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            onTap: () => onNavigateTab(2), // Jump to AI Tutor
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.picture_as_pdf, color: Colors.redAccent, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        doc.title,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        "${doc.pageCount} Pages • ${doc.chunkCount} Chunks Indexed",
                                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 20, color: Colors.grey),
                                  onPressed: () {
                                    ref.read(documentsProvider.notifier).deleteDocument(doc.id);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text("Removed ${doc.title}")),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(IconData icon, String label, String value, {VoidCallback? onTap}) {
    return GlassContainer(
      borderRadius: 14,
      blur: 10,
      opacity: 0.20,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white70, size: 14),
          const SizedBox(width: 4),
          Text("$label: ", style: const TextStyle(color: Colors.white70, fontSize: 11)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildSolidActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(20),
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        splashColor: Colors.white.withValues(alpha: 0.2),
        highlightColor: Colors.white.withValues(alpha: 0.1),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: -0.2,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.95),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGlassCourseCard(BuildContext context, WidgetRef ref, dynamic course) {
    final hexColor = int.parse(course.colorHex.replaceAll('#', '0xFF'));
    final color = Color(hexColor);

    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: GlassContainer(
        borderRadius: 20,
        blur: 16,
        opacity: 0.15,
        borderColor: color.withValues(alpha: 0.5),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    course.code,
                    style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11),
                  ),
                ),
                Text(
                  "${course.masteryScore}% Mastery",
                  style: TextStyle(
                    fontSize: 11,
                    color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black54,
                  ),
                ),
              ],
            ),
            Text(
              course.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: course.masteryScore / 100.0,
                backgroundColor: Colors.grey.withValues(alpha: 0.2),
                color: color,
                minHeight: 4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardAvatar(UserProfileModel profile) {
    if (profile.avatarPath != null && profile.avatarPath!.isNotEmpty) {
      final path = profile.avatarPath!;
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return CircleAvatar(
          radius: 20,
          backgroundImage: NetworkImage(path),
        );
      } else {
        final file = File(path);
        if (file.existsSync()) {
          return CircleAvatar(
            radius: 20,
            backgroundImage: FileImage(file),
          );
        }
      }
    }

    IconData presetIcon = Icons.school;
    switch (profile.avatarPreset) {
      case 'student_male':
        presetIcon = Icons.face;
        break;
      case 'student_female':
        presetIcon = Icons.face_3;
        break;
      case 'scholar':
        presetIcon = Icons.school;
        break;
      case 'graduate':
        presetIcon = Icons.military_tech;
        break;
      case 'code':
        presetIcon = Icons.code;
        break;
      case 'book':
        presetIcon = Icons.menu_book;
        break;
    }

    return CircleAvatar(
      radius: 20,
      backgroundColor: Colors.white.withValues(alpha: 0.25),
      child: Icon(presetIcon, color: Colors.white, size: 22),
    );
  }

  void _showLogStudyTimeDialog(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController(text: "15");
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Log Active Study Time ⏱️"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text("Add active study duration in minutes:"),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: "Minutes (e.g. 15, 30, 60)",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ActionChip(label: const Text("+15m"), onPressed: () => controller.text = "15"),
                ActionChip(label: const Text("+30m"), onPressed: () => controller.text = "30"),
                ActionChip(label: const Text("+60m"), onPressed: () => controller.text = "60"),
              ],
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
              final mins = int.tryParse(controller.text.trim()) ?? 0;
              if (mins > 0) {
                ref.read(userProfileProvider.notifier).incrementStudyTime(mins);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Logged +$mins mins to today's study progress!")),
                );
              }
            },
            child: const Text("Log Time"),
          ),
        ],
      ),
    );
  }
}
