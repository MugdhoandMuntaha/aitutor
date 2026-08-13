import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/user_profile_model.dart';


class DashboardScreen extends ConsumerWidget {
  final Function(int) onNavigateTab;

  const DashboardScreen({super.key, required this.onNavigateTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(userProfileProvider);
    final courses = ref.watch(coursesProvider);
    final documents = ref.watch(documentsProvider);

    final avgMastery = courses.isEmpty
        ? 0
        : (courses.map((c) => c.masteryScore).reduce((a, b) => a + b) / courses.length).round();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Dynamic App Bar / Header
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF6366F1), Color(0xFF06B6D4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 50, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            InkWell(
                              onTap: () => onNavigateTab(4), // Navigate to Profile Tab
                              child: _buildDashboardAvatar(profile),
                            ),

                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Welcome back 👋",
                                  style: TextStyle(color: Colors.white70, fontSize: 13),
                                ),
                                Text(
                                  "${profile.fullName} (${profile.major})",
                                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () => onNavigateTab(4),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white30),
                            ),
                            child: Row(
                              children: [
                                Text("🔥 ${profile.streakDays} Days", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildStatPill(Icons.analytics, "Mastery", "$avgMastery%"),
                        const SizedBox(width: 10),
                        _buildStatPill(Icons.timer, "Today", "${profile.todayStudyMinutes} mins"),
                        const SizedBox(width: 10),
                        _buildStatPill(Icons.folder_open, "Courses", "${courses.length}"),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Main Body Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Quick Actions Grid
                  const Text("Quick Actions", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.4,
                    children: [
                      _buildActionCard(
                        context,
                        title: "AI Tutor Chat",
                        subtitle: "Ask RAG Grounded Questions",
                        icon: Icons.psychology,
                        gradient: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        onTap: () => onNavigateTab(2),
                      ),
                      _buildActionCard(
                        context,
                        title: "Upload Materials",
                        subtitle: "PDF, Slides, Notes",
                        icon: Icons.upload_file,
                        gradient: const [Color(0xFF10B981), Color(0xFF059669)],
                        onTap: () => onNavigateTab(1),
                      ),
                      _buildActionCard(
                        context,
                        title: "AI Quiz Generator",
                        subtitle: "Test Knowledge",
                        icon: Icons.quiz,
                        gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                        onTap: () => onNavigateTab(3),
                      ),
                      _buildActionCard(
                        context,
                        title: "Study Schedule",
                        subtitle: "Adaptive Exam Planner",
                        icon: Icons.calendar_today,
                        gradient: const [Color(0xFFEC4899), Color(0xFFDB2777)],
                        onTap: () => onNavigateTab(3),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Weak Topics Alert Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.accentRose.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.accentRose.withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: AppTheme.accentRose, size: 32),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Weak Topics Recommendation",
                                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentRose, fontSize: 14),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "Target accuracy < 60% in active modules. Take a 5-min revision quiz.",
                                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => onNavigateTab(3),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accentRose,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text("Revise", style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Course Knowledge Bases Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Course Knowledge Bases", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: () => onNavigateTab(1),
                        child: const Text("View All"),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Courses Horizontal ListView
                  if (courses.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text("No courses added yet. Tap 'View All' to create a course!"),
                      ),
                    )
                  else
                    SizedBox(
                      height: 140,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: courses.length,
                        itemBuilder: (context, index) {
                          final course = courses[index];
                          return _buildCourseCard(context, ref, course);
                        },
                      ),
                    ),

                  const SizedBox(height: 24),

                  // Recent Uploaded Documents Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Recent Course Materials", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: () => onNavigateTab(1),
                        child: const Text("Upload"),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (documents.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(16),
                      ),
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
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Color(0xFF334155),
                              child: Icon(Icons.picture_as_pdf, color: Colors.redAccent),
                            ),
                            title: Text(doc.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            subtitle: Text("${doc.pageCount} Pages • ${doc.chunkCount} Chunks Indexed"),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete_outline, size: 20, color: Colors.grey),
                              onPressed: () {
                                ref.read(documentsProvider.notifier).deleteDocument(doc.id);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text("Removed ${doc.title}")),
                                );
                              },
                            ),
                            onTap: () {
                              onNavigateTab(2); // Jump to AI Tutor Chat
                            },
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

  Widget _buildStatPill(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black26,
        borderRadius: BorderRadius.circular(12),
      ),
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

  Widget _buildActionCard(BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: gradient.first.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            CircleAvatar(
              backgroundColor: Colors.white24,
              radius: 18,
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 10)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(BuildContext context, WidgetRef ref, dynamic course) {
    final hexColor = int.parse(course.colorHex.replaceAll('#', '0xFF'));
    final color = Color(hexColor);

    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.5), width: 1.5),
      ),
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
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  course.code,
                  style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
              Text("${course.masteryScore}% Mastery", style: const TextStyle(color: Colors.white70, fontSize: 11)),
            ],
          ),
          Text(
            course.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          LinearProgressIndicator(
            value: course.masteryScore / 100.0,
            backgroundColor: Colors.white10,
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardAvatar(UserProfileModel profile) {
    if (profile.avatarPath != null && profile.avatarPath!.isNotEmpty) {
      final file = File(profile.avatarPath!);
      if (file.existsSync()) {
        return CircleAvatar(
          radius: 20,
          backgroundImage: FileImage(file),
        );
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
      backgroundColor: Colors.white24,
      child: Icon(presetIcon, color: Colors.white, size: 22),
    );
  }
}

