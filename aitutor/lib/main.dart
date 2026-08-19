import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/env_config.dart';
import 'core/services/supabase_service.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/app_providers.dart';

import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/courses/presentation/courses_screen.dart';
import 'features/ai_tutor/presentation/ai_tutor_screen.dart';
import 'features/quiz/presentation/quiz_screen.dart';
import 'features/flashcards/presentation/flashcards_screen.dart';
import 'features/study_plan/presentation/study_plan_screen.dart';
import 'features/profile/presentation/profile_screen.dart';

import 'shared/widgets/glass_container.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.init();
  await SupabaseService.init();

  runApp(
    const ProviderScope(
      child: AIStudyCompanionApp(),
    ),
  );
}

class AIStudyCompanionApp extends ConsumerWidget {
  const AIStudyCompanionApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp(
      title: 'AI Study Companion',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      darkTheme: AppTheme.darkTheme,
      theme: AppTheme.lightTheme,
      home: const MainNavigationScaffold(),
    );
  }
}

class MainNavigationScaffold extends StatefulWidget {
  const MainNavigationScaffold({super.key});

  @override
  State<MainNavigationScaffold> createState() => _MainNavigationScaffoldState();
}

class _MainNavigationScaffoldState extends State<MainNavigationScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<Widget> screens = [
      DashboardScreen(onNavigateTab: (index) => setState(() => _currentIndex = index)),
      const CoursesScreen(),
      const AITutorScreen(),
      const QuizAndFlashcardsTabScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          // Ambient Mesh Gradient Background with 3 glow orbs
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
              ),
              child: Stack(
                children: [
                  // Indigo orb — top right
                  Positioned(
                    top: -80,
                    right: -80,
                    child: Container(
                      width: 320,
                      height: 320,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.primaryIndigo.withValues(alpha: isDark ? 0.22 : 0.10),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryIndigo.withValues(alpha: isDark ? 0.28 : 0.14),
                            blurRadius: 120,
                            spreadRadius: 30,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Cyan orb — bottom left
                  Positioned(
                    bottom: 120,
                    left: -60,
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.accentCyan.withValues(alpha: isDark ? 0.18 : 0.08),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentCyan.withValues(alpha: isDark ? 0.22 : 0.10),
                            blurRadius: 100,
                            spreadRadius: 25,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Purple orb — center right (new)
                  Positioned(
                    top: MediaQuery.of(context).size.height * 0.4,
                    right: -40,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.accentPurple.withValues(alpha: isDark ? 0.14 : 0.06),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentPurple.withValues(alpha: isDark ? 0.18 : 0.08),
                            blurRadius: 80,
                            spreadRadius: 15,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Main Screen Content Stack
          IndexedStack(
            index: _currentIndex,
            children: screens,
          ),
        ],
      ),

      // Floating Glass Bottom Navigation Bar
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: GlassContainer(
            borderRadius: 32,
            blur: 28,
            opacityColor: isDark ? const Color(0xFF0F1629) : Colors.white,
            opacity: isDark ? 0.78 : 0.92,
            borderColor: isDark
                ? AppTheme.primaryIndigo.withValues(alpha: 0.25)
                : Colors.white.withValues(alpha: 0.85),
            borderWidth: 1.5,
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryIndigo.withValues(alpha: isDark ? 0.20 : 0.12),
                blurRadius: 24,
                spreadRadius: -4,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: AppTheme.accentCyan.withValues(alpha: isDark ? 0.08 : 0.05),
                blurRadius: 40,
                spreadRadius: 0,
                offset: const Offset(0, 4),
              ),
            ],
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: NavigationBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              indicatorColor: AppTheme.primaryIndigo.withValues(alpha: 0.18),
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) => setState(() => _currentIndex = index),
              destinations: [
                NavigationDestination(
                  icon: Icon(Icons.dashboard_outlined, color: isDark ? Colors.white54 : Colors.black45),
                  selectedIcon: const Icon(Icons.dashboard_rounded, color: AppTheme.primaryIndigo),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: Icon(Icons.folder_outlined, color: isDark ? Colors.white54 : Colors.black45),
                  selectedIcon: const Icon(Icons.folder_rounded, color: AppTheme.accentCyan),
                  label: 'Courses',
                ),
                NavigationDestination(
                  icon: Icon(Icons.auto_awesome_outlined, color: isDark ? Colors.white54 : Colors.black45),
                  selectedIcon: const Icon(Icons.auto_awesome, color: AppTheme.accentPurple),
                  label: 'AI Tutor',
                ),
                NavigationDestination(
                  icon: Icon(Icons.quiz_outlined, color: isDark ? Colors.white54 : Colors.black45),
                  selectedIcon: const Icon(Icons.quiz_rounded, color: AppTheme.accentAmber),
                  label: 'Quizzes',
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline_rounded, color: isDark ? Colors.white54 : Colors.black45),
                  selectedIcon: const Icon(Icons.person_rounded, color: AppTheme.accentEmerald),
                  label: 'Profile',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class QuizAndFlashcardsTabScreen extends StatelessWidget {
  const QuizAndFlashcardsTabScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Study Tools"),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.quiz), text: "Quizzes"),
              Tab(icon: Icon(Icons.style), text: "Flashcards"),
              Tab(icon: Icon(Icons.calendar_month), text: "Schedule"),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            QuizScreen(),
            FlashcardsScreen(),
            StudyPlanScreen(),
          ],
        ),
      ),
    );
  }
}
