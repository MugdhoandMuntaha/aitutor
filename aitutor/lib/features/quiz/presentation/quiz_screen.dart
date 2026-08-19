import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/quiz_model.dart';
import '../../../shared/widgets/glass_container.dart';

class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key});

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  int _currentIndex = 0;
  int _score = 0;
  int? _selectedOptionIndex;
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final questions = ref.watch(quizProvider);
    final quizNotifier = ref.watch(quizProvider.notifier);
    final selectedCourse = ref.watch(selectedCourseProvider);
    final courses = ref.watch(coursesProvider);
    final documents = ref.watch(documentsProvider);

    String quizTopic = selectedCourse?.title ??
        (courses.isNotEmpty ? courses.first.title : (documents.isNotEmpty ? documents.first.title : "Course Materials"));

    if (_currentIndex >= questions.length && questions.isNotEmpty) {
      _currentIndex = questions.length - 1;
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quiz Setup Banner (Glassmorphic)
          GlassContainer(
            borderRadius: 20,
            blur: 16,
            opacity: 0.20,
            gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Generate AI Quiz", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      SizedBox(height: 4),
                      Text("Generated directly from lecture notes", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.add_comment_outlined, color: Colors.white),
                      tooltip: "Add Custom Question",
                      onPressed: () => _showAddQuestionDialog(),
                    ),
                    if (questions.isNotEmpty)
                      IconButton(
                        icon: const Icon(Icons.restart_alt, color: Colors.white),
                        tooltip: "Reset Quiz Session",
                        onPressed: () {
                          ref.read(quizProvider.notifier).resetQuiz();
                          setState(() {
                            _currentIndex = 0;
                            _score = 0;
                            _selectedOptionIndex = null;
                            _submitted = false;
                          });
                        },
                      ),
                    ElevatedButton(
                      onPressed: () {
                        ref.read(quizProvider.notifier).generateQuizForTopic(quizTopic);
                        setState(() {
                          _currentIndex = 0;
                          _score = 0;
                          _selectedOptionIndex = null;
                          _submitted = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      child: const Text("New Quiz"),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          if (quizNotifier.isGenerating)
            const Expanded(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(30.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: AppTheme.accentAmber),
                      SizedBox(height: 12),
                      Text("Generating AI Questions from Lecture Notes...", style: TextStyle(color: AppTheme.accentAmber)),
                    ],
                  ),
                ),
              ),
            )
          else if (questions.isEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.quiz_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 12),
                    const Text("No active quiz session.", style: TextStyle(fontSize: 16, color: Colors.grey)),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () {
                            ref.read(quizProvider.notifier).generateQuizForTopic(quizTopic);
                          },
                          icon: const Icon(Icons.auto_awesome),
                          label: const Text("Generate AI Quiz"),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          onPressed: () => _showAddQuestionDialog(),
                          icon: const Icon(Icons.add),
                          label: const Text("Add Question"),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            )
          else ...[
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Question Progress Indicator
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text("Question ${_currentIndex + 1} of ${questions.length}", style: const TextStyle(fontWeight: FontWeight.bold)),
                        Row(
                          children: [
                            Text("Score: $_score", style: const TextStyle(color: AppTheme.accentEmerald, fontWeight: FontWeight.bold)),
                            const SizedBox(width: 10),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.grey, size: 20),
                              tooltip: "Delete Question",
                              onPressed: () {
                                final curId = questions[_currentIndex].id;
                                ref.read(quizProvider.notifier).deleteQuestion(curId);
                                setState(() {
                                  if (_currentIndex > 0) _currentIndex--;
                                  _selectedOptionIndex = null;
                                  _submitted = false;
                                });
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (_currentIndex + 1) / questions.length,
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                        color: AppTheme.accentAmber,
                        minHeight: 6,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Current Question Glass Card
                    GlassContainer(
                      borderRadius: 20,
                      blur: 16,
                      opacity: 0.15,
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            questions[_currentIndex].question,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),

                          // Options
                          ...List.generate(
                            questions[_currentIndex].options.length,
                            (index) => Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              child: Material(
                                color: _getOptionColor(index, questions[_currentIndex].correctIndex),
                                borderRadius: BorderRadius.circular(14),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(14),
                                  onTap: _submitted ? null : () {
                                    setState(() {
                                      _selectedOptionIndex = index;
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: _selectedOptionIndex == index ? AppTheme.accentAmber : Theme.of(context).dividerColor,
                                      ),
                                    ),
                                    child: Text(questions[_currentIndex].options[index], style: const TextStyle(fontSize: 14)),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          if (_submitted) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Theme.of(context).brightness == Brightness.dark ? Colors.white10 : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text("Explanation:", style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.accentCyan)),
                                  const SizedBox(height: 4),
                                  Text(questions[_currentIndex].explanation, style: const TextStyle(fontSize: 12)),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // Action Button
            Padding(
              padding: const EdgeInsets.only(top: 8.0, bottom: 4.0),
              child: SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _selectedOptionIndex == null
                      ? null
                      : () {
                          if (!_submitted) {
                            setState(() {
                              _submitted = true;
                              if (_selectedOptionIndex == questions[_currentIndex].correctIndex) {
                                _score++;
                              }
                            });
                          } else {
                            if (_currentIndex < questions.length - 1) {
                              setState(() {
                                _currentIndex++;
                                _selectedOptionIndex = null;
                                _submitted = false;
                              });
                            } else {
                              _showResultsDialog();
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentAmber,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    _submitted ? (_currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz") : "Submit Answer",
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getOptionColor(int optionIndex, int correctIndex) {
    if (!_submitted) {
      return _selectedOptionIndex == optionIndex ? AppTheme.primaryIndigo.withValues(alpha: 0.3) : Theme.of(context).cardColor;
    }
    if (optionIndex == correctIndex) {
      return AppTheme.accentEmerald.withValues(alpha: 0.3);
    }
    if (_selectedOptionIndex == optionIndex) {
      return AppTheme.accentRose.withValues(alpha: 0.3);
    }
    return Theme.of(context).cardColor;
  }

  void _showAddQuestionDialog() {
    final qCtrl = TextEditingController();
    final opt1Ctrl = TextEditingController();
    final opt2Ctrl = TextEditingController();
    final opt3Ctrl = TextEditingController();
    final opt4Ctrl = TextEditingController();
    final expCtrl = TextEditingController();
    int correctIndex = 0;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text("Add Custom Quiz Question"),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: qCtrl,
                  decoration: const InputDecoration(labelText: "Question Prompt"),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: opt1Ctrl,
                  decoration: const InputDecoration(labelText: "Option 1"),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: opt2Ctrl,
                  decoration: const InputDecoration(labelText: "Option 2"),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: opt3Ctrl,
                  decoration: const InputDecoration(labelText: "Option 3"),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: opt4Ctrl,
                  decoration: const InputDecoration(labelText: "Option 4"),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  initialValue: correctIndex,
                  decoration: const InputDecoration(labelText: "Correct Option Index"),
                  items: const [
                    DropdownMenuItem(value: 0, child: Text("Option 1 is Correct")),
                    DropdownMenuItem(value: 1, child: Text("Option 2 is Correct")),
                    DropdownMenuItem(value: 2, child: Text("Option 3 is Correct")),
                    DropdownMenuItem(value: 3, child: Text("Option 4 is Correct")),
                  ],
                  onChanged: (val) {
                    if (val != null) setStateDialog(() => correctIndex = val);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: expCtrl,
                  decoration: const InputDecoration(labelText: "Explanation"),
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
                if (qCtrl.text.isNotEmpty && opt1Ctrl.text.isNotEmpty && opt2Ctrl.text.isNotEmpty) {
                  final newQ = QuizQuestion(
                    id: const Uuid().v4(),
                    question: qCtrl.text.trim(),
                    options: [
                      opt1Ctrl.text.trim(),
                      opt2Ctrl.text.trim(),
                      opt3Ctrl.text.trim().isNotEmpty ? opt3Ctrl.text.trim() : "None",
                      opt4Ctrl.text.trim().isNotEmpty ? opt4Ctrl.text.trim() : "All of the above",
                    ],
                    correctIndex: correctIndex,
                    explanation: expCtrl.text.trim().isNotEmpty ? expCtrl.text.trim() : "Correct answer verified.",
                    topic: "Custom Quiz",
                  );
                  ref.read(quizProvider.notifier).addQuestion(newQ);
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Custom question added!")),
                  );
                }
              },
              child: const Text("Add Question"),
            ),
          ],
        ),
      ),
    );
  }

  void _showResultsDialog() {
    final questions = ref.read(quizProvider);
    final totalQ = questions.isEmpty ? 1 : questions.length;
    final masteryPct = ((_score / totalQ) * 100).round();

    // Dynamically update course mastery score
    final selectedCourse = ref.read(selectedCourseProvider);
    if (selectedCourse != null) {
      ref.read(coursesProvider.notifier).updateMasteryScore(selectedCourse.id, masteryPct);
    } else {
      final courses = ref.read(coursesProvider);
      if (courses.isNotEmpty) {
        ref.read(coursesProvider.notifier).updateMasteryScore(courses.first.id, masteryPct);
      }
    }

    // Increment study time for quiz completion
    ref.read(userProfileProvider.notifier).incrementStudyTime(5);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Quiz Completed 🎉"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Your Final Score: $_score / ${questions.length}", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(
              masteryPct >= 70
                  ? "Great job! Topic Mastery score updated to $masteryPct%."
                  : "Topic Mastery score: $masteryPct%. Recommendation: Review lecture notes on weak topics.",
              style: const TextStyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                _currentIndex = 0;
                _score = 0;
                _selectedOptionIndex = null;
                _submitted = false;
              });
            },
            child: const Text("Close"),
          ),
        ],
      ),
    );
  }
}
