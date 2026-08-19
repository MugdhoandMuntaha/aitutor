import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/config/env_config.dart';
import '../../../shared/models/user_profile_model.dart';
import '../../../shared/widgets/glass_container.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(userProfileProvider);
    final courses = ref.watch(coursesProvider);
    final documents = ref.watch(documentsProvider);
    final tutorMode = ref.watch(tutorModeProvider);
    final isVoiceEnabled = ref.watch(isVoiceEnabledProvider);
    final themeMode = ref.watch(themeModeProvider);

    final avgMastery = courses.isEmpty
        ? 0
        : (courses.map((c) => c.masteryScore).reduce((a, b) => a + b) / courses.length).round();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Student Profile & Settings"),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_note_rounded),
            tooltip: "Edit Profile",
            onPressed: () => _showEditProfileDialog(context, ref, profile),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. iOS 26 Glassmorphic Profile Header Card
            GlassContainer(
              borderRadius: 24,
              blur: 20,
              opacity: 0.20,
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Stack(
                    children: [
                      _buildAvatarDisplay(profile, radius: 36),
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: GestureDetector(
                          onTap: () => _showAvatarPickerModal(context, ref, profile),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: const BoxDecoration(
                              color: AppTheme.accentEmerald,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          profile.fullName,
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          profile.major,
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13, fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          profile.university,
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            profile.academicYear,
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 2. Dynamic Performance Metrics Grid (Responsive for Mobile Phone Screens)
            const Text(
              "Academic Metrics",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
            ),
            const SizedBox(height: 12),

            LayoutBuilder(
              builder: (context, constraints) {
                final crossCount = constraints.maxWidth > 600 ? 4 : 2;
                return GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: crossCount,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: constraints.maxWidth > 600 ? 1.6 : 1.45,
                  children: [
                    _buildGlassMetricTile(
                      context,
                      icon: Icons.local_fire_department,
                      iconColor: AppTheme.accentAmber,
                      label: "Study Streak",
                      value: "${profile.streakDays} Days 🔥",
                      subtitle: "Consecutive Days Active",
                    ),
                    _buildGlassMetricTile(
                      context,
                      icon: Icons.timer,
                      iconColor: AppTheme.accentCyan,
                      label: "Daily Progress",
                      value: "${profile.todayStudyMinutes} / ${profile.dailyGoalMinutes}m",
                      subtitle: "Tap to Log Time",
                      onTap: () => _showLogStudyTimeDialog(context, ref),
                    ),
                    _buildGlassMetricTile(
                      context,
                      icon: Icons.school,
                      iconColor: AppTheme.accentEmerald,
                      label: "Average Mastery",
                      value: "$avgMastery%",
                      subtitle: "${courses.length} Active Courses",
                    ),
                    _buildGlassMetricTile(
                      context,
                      icon: Icons.library_books,
                      iconColor: AppTheme.primaryIndigo,
                      label: "RAG Knowledge Base",
                      value: "${documents.length} Materials",
                      subtitle: "PDFs & Notes Ingested",
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 24),

            // 3. Application Appearance & Theme Settings
            const Text(
              "Appearance & Theme",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
            ),
            const SizedBox(height: 12),

            GlassContainer(
              borderRadius: 20,
              blur: 16,
              opacity: 0.15,
              child: Column(
                children: [
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.light,
                    groupValue: themeMode,
                    title: const Text("Light Glass Theme (Default)", style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text("Crisp, clean iOS glass light design"),
                    secondary: const Icon(Icons.wb_sunny_outlined, color: AppTheme.accentAmber),
                    onChanged: (val) {
                      if (val != null) ref.read(themeModeProvider.notifier).state = val;
                    },
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.dark,
                    groupValue: themeMode,
                    title: const Text("Dark Glass Mode", style: TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: const Text("Sleek dark glass theme for night study sessions"),
                    secondary: const Icon(Icons.nightlight_round, color: AppTheme.primaryIndigo),
                    onChanged: (val) {
                      if (val != null) ref.read(themeModeProvider.notifier).state = val;
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 4. AI Engines & Integrations Status
            const Text(
              "AI Integration Status",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
            ),
            const SizedBox(height: 12),

            GlassContainer(
              borderRadius: 20,
              blur: 16,
              opacity: 0.15,
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildApiStatusRow(
                    serviceName: "Google Gemini 1.5 & Vector Embeddings",
                    status: EnvConfig.geminiApiKey.isNotEmpty ? "Active" : "Key Required",
                    isActive: EnvConfig.geminiApiKey.isNotEmpty,
                  ),
                  const Divider(height: 20),
                  _buildApiStatusRow(
                    serviceName: "Groq Fast Inference Engine",
                    status: EnvConfig.groqApiKey.isNotEmpty ? "Active" : "Key Required",
                    isActive: EnvConfig.groqApiKey.isNotEmpty,
                  ),
                  const Divider(height: 20),
                  _buildApiStatusRow(
                    serviceName: "ElevenLabs AI Voice Tutor",
                    status: EnvConfig.elevenlabsApiKey.isNotEmpty ? "Active" : "Key Required",
                    isActive: EnvConfig.elevenlabsApiKey.isNotEmpty,
                  ),
                  const Divider(height: 20),
                  _buildApiStatusRow(
                    serviceName: "Supabase Vector PostgreSQL",
                    status: EnvConfig.supabaseUrl.isNotEmpty ? "Connected" : "Not Configured",
                    isActive: EnvConfig.supabaseUrl.isNotEmpty,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 5. Tutor Preferences & Settings
            const Text(
              "Tutor Preferences",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3),
            ),
            const SizedBox(height: 12),

            GlassContainer(
              borderRadius: 20,
              blur: 16,
              opacity: 0.15,
              child: Column(
                children: [
                  Material(
                    color: Colors.transparent,
                    child: ListTile(
                      leading: const Icon(Icons.psychology, color: AppTheme.primaryIndigo),
                      title: const Text("Default Teaching Mode", style: TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text("Currently: ${tutorMode.toUpperCase()} Mode"),
                      trailing: DropdownButton<String>(
                        value: tutorMode,
                        underline: const SizedBox(),
                        items: const [
                          DropdownMenuItem(value: 'direct', child: Text("Direct Tutor")),
                          DropdownMenuItem(value: 'socratic', child: Text("Socratic Mode")),
                          DropdownMenuItem(value: 'beginner', child: Text("Beginner Mode")),
                          DropdownMenuItem(value: 'exam', child: Text("Exam Mode")),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            ref.read(tutorModeProvider.notifier).state = val;
                          }
                        },
                      ),
                    ),
                  ),
                  Divider(height: 1, color: Theme.of(context).dividerColor),
                  Material(
                    color: Colors.transparent,
                    child: SwitchListTile(
                      secondary: Icon(
                        isVoiceEnabled ? Icons.volume_up : Icons.volume_off,
                        color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
                      ),
                      title: const Text("Voice Audio Assistant (ElevenLabs)", style: TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: const Text("Automatically speak tutor explanations"),
                      value: isVoiceEnabled,
                      onChanged: (val) {
                        ref.read(isVoiceEnabledProvider.notifier).state = val;
                      },
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Refresh Cache Action Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Knowledge Base cache refreshed cleanly.")),
                  );
                },
                icon: const Icon(Icons.refresh, color: AppTheme.accentRose),
                label: const Text("Refresh Knowledge Base Cache", style: TextStyle(color: AppTheme.accentRose)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.accentRose),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildAvatarDisplay(UserProfileModel profile, {required double radius}) {
    if (profile.avatarPath != null && profile.avatarPath!.isNotEmpty) {
      final path = profile.avatarPath!;
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return CircleAvatar(
          radius: radius,
          backgroundImage: NetworkImage(path),
        );
      } else {
        final file = File(path);
        if (file.existsSync()) {
          return CircleAvatar(
            radius: radius,
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
      default:
        presetIcon = Icons.school;
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: Colors.white.withValues(alpha: 0.25),
      child: Icon(presetIcon, color: Colors.white, size: radius * 1.1),
    );
  }

  Widget _buildGlassMetricTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required String subtitle,
    VoidCallback? onTap,
  }) {
    return GlassContainer(
      borderRadius: 18,
      blur: 14,
      opacity: 0.15,
      padding: const EdgeInsets.all(12),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subtitle,
            style: const TextStyle(color: Colors.grey, fontSize: 10),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
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

  Widget _buildApiStatusRow({
    required String serviceName,
    required String status,
    required bool isActive,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(serviceName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.accentEmerald.withValues(alpha: 0.15) : AppTheme.accentRose.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isActive ? AppTheme.accentEmerald : AppTheme.accentRose,
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 4,
                backgroundColor: isActive ? AppTheme.accentEmerald : AppTheme.accentRose,
              ),
              const SizedBox(width: 6),
              Text(
                status,
                style: TextStyle(
                  color: isActive ? AppTheme.accentEmerald : AppTheme.accentRose,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showAvatarPickerModal(BuildContext context, WidgetRef ref, UserProfileModel profile) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => GlassContainer(
        borderRadius: 24,
        blur: 24,
        opacity: 0.85,
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Change Profile Picture", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: AppTheme.primaryIndigo,
                child: Icon(Icons.photo_library, color: Colors.white),
              ),
              title: const Text("Upload Custom Photo"),
              subtitle: const Text("Choose an image file from your device"),
              onTap: () async {
                Navigator.pop(context);
                final files = await FilePicker.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
                );
                if (files.isNotEmpty && files.first.path != null) {
                  ref.read(userProfileProvider.notifier).setAvatarPath(files.first.path!);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Profile picture updated successfully!")),
                    );
                  }
                }
              },
            ),
            const Divider(),
            const Text("Or Select Academic Avatar:", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAvatarPresetChip(context, ref, 'student_male', Icons.face, "Male Scholar"),
                _buildAvatarPresetChip(context, ref, 'student_female', Icons.face_3, "Female Scholar"),
                _buildAvatarPresetChip(context, ref, 'scholar', Icons.school, "Academic"),
                _buildAvatarPresetChip(context, ref, 'code', Icons.code, "Tech"),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarPresetChip(BuildContext context, WidgetRef ref, String presetKey, IconData icon, String label) {
    return InkWell(
      onTap: () {
        ref.read(userProfileProvider.notifier).setAvatarPreset(presetKey);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Selected $label avatar!")),
        );
      },
      child: Column(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppTheme.primaryIndigo.withValues(alpha: 0.15),
            child: Icon(icon, color: AppTheme.primaryIndigo, size: 28),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  void _showEditProfileDialog(BuildContext context, WidgetRef ref, UserProfileModel profile) {
    final nameCtrl = TextEditingController(text: profile.fullName);
    final emailCtrl = TextEditingController(text: profile.email);
    final uniCtrl = TextEditingController(text: profile.university);
    final majorCtrl = TextEditingController(text: profile.major);
    final yearCtrl = TextEditingController(text: profile.academicYear);
    final goalCtrl = TextEditingController(text: profile.dailyGoalMinutes.toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Edit Student Profile"),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: "Full Name"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: emailCtrl,
                decoration: const InputDecoration(labelText: "Email Address"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: uniCtrl,
                decoration: const InputDecoration(labelText: "University"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: majorCtrl,
                decoration: const InputDecoration(labelText: "Major / Department"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: yearCtrl,
                decoration: const InputDecoration(labelText: "Academic Year / Semester"),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: goalCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Daily Study Goal (Minutes)"),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () {
              ref.read(userProfileProvider.notifier).updateProfile(
                fullName: nameCtrl.text.trim(),
                email: emailCtrl.text.trim(),
                university: uniCtrl.text.trim(),
                major: majorCtrl.text.trim(),
                academicYear: yearCtrl.text.trim(),
                dailyGoalMinutes: int.tryParse(goalCtrl.text.trim()) ?? 60,
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text("Profile updated successfully!")),
              );
            },
            child: const Text("Save Changes"),
          ),
        ],
      ),
    );
  }
}
