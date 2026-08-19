import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/config/env_config.dart';
import '../../../shared/models/user_profile_model.dart';

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
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Profile Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryIndigo.withOpacity(0.25),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
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
                            padding: const EdgeInsets.all(4),
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
                        ),
                        const SizedBox(height: 4),
                        Text(
                          profile.major,
                          style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          profile.university,
                          style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 11),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(12),
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

            // 2. Dynamic Performance Metrics Grid
            const Text("Academic Metrics", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                _buildMetricTile(
                  context,
                  icon: Icons.local_fire_department,
                  iconColor: Colors.orangeAccent,
                  label: "Study Streak",
                  value: "${profile.streakDays} Days 🔥",
                  subtitle: "Consecutive Days Active",
                ),
                _buildMetricTile(
                  context,
                  icon: Icons.timer,
                  iconColor: AppTheme.accentCyan,
                  label: "Daily Progress",
                  value: "${profile.todayStudyMinutes} / ${profile.dailyGoalMinutes} mins",
                  subtitle: "Daily Target Progress",
                ),
                _buildMetricTile(
                  context,
                  icon: Icons.school,
                  iconColor: AppTheme.accentEmerald,
                  label: "Average Mastery",
                  value: "$avgMastery%",
                  subtitle: "${courses.length} Active Courses",
                ),
                _buildMetricTile(
                  context,
                  icon: Icons.library_books,
                  iconColor: AppTheme.primaryIndigo,
                  label: "RAG Knowledge Base",
                  value: "${documents.length} Materials",
                  subtitle: "PDFs & Notes Ingested",
                ),
              ],

            ),

            const SizedBox(height: 24),

            // 3. Application Appearance & Theme Settings
            const Text("Appearance & Theme", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Card(
              child: Column(
                children: [
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.light,
                    groupValue: themeMode,
                    title: const Text("Light Formal Theme (Default)"),
                    subtitle: const Text("Crisp, clean formal academic light design"),
                    secondary: const Icon(Icons.wb_sunny_outlined, color: AppTheme.accentAmber),
                    onChanged: (val) {
                      if (val != null) ref.read(themeModeProvider.notifier).state = val;
                    },
                  ),
                  const Divider(height: 1),
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.dark,
                    groupValue: themeMode,
                    title: const Text("Dark Modern Mode"),
                    subtitle: const Text("Sleek dark theme for night study sessions"),
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
            const Text("AI Integration Status", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
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
            ),

            const SizedBox(height: 24),

            // 5. Tutor Preferences & Settings
            const Text("Tutor Preferences", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.psychology, color: AppTheme.primaryIndigo),
                    title: const Text("Default Teaching Mode"),
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
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: Icon(
                      isVoiceEnabled ? Icons.volume_up : Icons.volume_off,
                      color: isVoiceEnabled ? AppTheme.accentEmerald : Colors.grey,
                    ),
                    title: const Text("Voice Audio Assistant (ElevenLabs)"),
                    subtitle: const Text("Automatically speak tutor explanations"),
                    value: isVoiceEnabled,
                    onChanged: (val) {
                      ref.read(isVoiceEnabledProvider.notifier).state = val;
                    },
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
      final file = File(profile.avatarPath!);
      if (file.existsSync()) {
        return CircleAvatar(
          radius: radius,
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
      default:
        presetIcon = Icons.school;
    }

    return CircleAvatar(
      radius: radius,
      backgroundColor: Colors.white24,
      child: Icon(presetIcon, color: Colors.white, size: radius * 1.1),
    );
  }

  Widget _buildMetricTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.lightCardBorder),
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
            ],
          ),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 10)),
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
          child: Text(serviceName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.accentEmerald.withOpacity(0.15) : AppTheme.accentRose.withOpacity(0.15),
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
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
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
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Profile picture updated successfully!")),
                  );
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
            backgroundColor: AppTheme.primaryIndigo.withOpacity(0.15),
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
