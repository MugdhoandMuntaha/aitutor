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
    final List<Widget> screens = [
      DashboardScreen(onNavigateTab: (index) => setState(() => _currentIndex = index)),
      const CoursesScreen(),
      const AITutorScreen(),
      const QuizAndFlashcardsTabScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppTheme.primaryIndigo),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppTheme.primaryIndigo),
            label: 'Courses',
          ),
          NavigationDestination(
            icon: Icon(Icons.psychology_outlined),
            selectedIcon: Icon(Icons.psychology, color: AppTheme.primaryIndigo),
            label: 'AI Tutor',
          ),
          NavigationDestination(
            icon: Icon(Icons.quiz_outlined),
            selectedIcon: Icon(Icons.quiz, color: AppTheme.primaryIndigo),
            label: 'Quizzes',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primaryIndigo),
            label: 'Profile',
          ),
        ],
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
