import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/widgets/glass_container.dart';

class FlashcardItem {
  final String id;
  final String front;
  final String back;

  FlashcardItem({required this.id, required this.front, required this.back});
}

class FlashcardsScreen extends ConsumerStatefulWidget {
  const FlashcardsScreen({super.key});

  @override
  ConsumerState<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends ConsumerState<FlashcardsScreen> {
  final List<FlashcardItem> _flashcards = [];
  int _currentIndex = 0;
  bool _showBack = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
      child: _flashcards.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.style_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    "No flashcards in deck.",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Create custom flashcards or upload notes to generate cards.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _showAddFlashcardDialog,
                    icon: const Icon(Icons.add),
                    label: const Text("Create Flashcard"),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Card ${_currentIndex + 1} of ${_flashcards.length}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.grey, size: 20),
                          onPressed: () {
                            setState(() {
                              _flashcards.removeAt(_currentIndex);
                              if (_currentIndex >= _flashcards.length && _currentIndex > 0) {
                                _currentIndex--;
                              }
                              _showBack = false;
                            });
                          },
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          "Spaced Repetition Deck",
                          style: TextStyle(color: AppTheme.accentCyan, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _showBack = !_showBack;
                      });
                    },
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 400),
                      transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                      child: GlassContainer(
                        key: ValueKey(_showBack),
                        width: double.infinity,
                        borderRadius: 24,
                        blur: 20,
                        opacity: _showBack ? 0.25 : 0.85,
                        gradient: !_showBack
                            ? const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              )
                            : null,
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              _showBack ? "ANSWER" : "QUESTION",
                              style: TextStyle(
                                color: _showBack ? AppTheme.accentCyan : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              _showBack ? _flashcards[_currentIndex].back : _flashcards[_currentIndex].front,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: _showBack
                                    ? (Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87)
                                    : Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 30),
                            const Text("(Tap card to flip)", style: TextStyle(color: Colors.grey, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    IconButton.filled(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: _currentIndex > 0
                          ? () {
                              setState(() {
                                _currentIndex--;
                                _showBack = false;
                              });
                            }
                          : null,
                    ),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _showBack = !_showBack;
                        });
                        ref.read(userProfileProvider.notifier).incrementStudyTime(1);
                      },
                      icon: const Icon(Icons.flip),
                      label: const Text("Flip Card"),
                    ),
                    IconButton.filled(
                      icon: const Icon(Icons.arrow_forward),
                      onPressed: _currentIndex < _flashcards.length - 1
                          ? () {
                              setState(() {
                                _currentIndex++;
                                _showBack = false;
                              });
                            }
                          : null,
                    ),
                  ],
                ),
              ],
            ),
    );
  }

  void _showAddFlashcardDialog() {
    final frontCtrl = TextEditingController();
    final backCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Add Study Flashcard"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: frontCtrl,
              decoration: const InputDecoration(labelText: "Front (Question / Concept)"),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: backCtrl,
              decoration: const InputDecoration(labelText: "Back (Answer / Explanation)"),
              maxLines: 3,
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
              if (frontCtrl.text.isNotEmpty && backCtrl.text.isNotEmpty) {
                setState(() {
                  _flashcards.add(FlashcardItem(
                    id: const Uuid().v4(),
                    front: frontCtrl.text.trim(),
                    back: backCtrl.text.trim(),
                  ));
                });
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Flashcard added!")),
                );
              }
            },
            child: const Text("Save Card"),
          ),
        ],
      ),
    );
  }
}
