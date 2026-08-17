import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({super.key});

  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> {
  final List<Map<String, String>> _flashcards = [
    {
      "front": "What is CPU Pipelining?",
      "back": "An implementation technique where multiple instructions are overlapped in execution across hardware stages (IF, ID, EX, MEM, WB)."
    },
    {
      "front": "What are the 3 types of Pipeline Hazards?",
      "back": "1. Structural Hazards (Hardware resource conflict)\n2. Data Hazards (Data dependency)\n3. Control Hazards (Branch delays)"
    },
    {
      "front": "What is Locality of Reference?",
      "back": "Temporal Locality (recently accessed data reused soon) and Spatial Locality (nearby memory locations accessed soon)."
    },
    {
      "front": "What are the 4 conditions for Operating System Deadlocks?",
      "back": "1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait"
    },
  ];

  int _currentIndex = 0;
  bool _showBack = false;

  @override
  Widget build(BuildContext context) {
    final card = _flashcards[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text("AI Study Flashcards"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Card ${_currentIndex + 1} of ${_flashcards.length}", style: const TextStyle(fontWeight: FontWeight.bold)),
                const Text("Spaced Repetition Deck", style: TextStyle(color: AppTheme.accentCyan, fontSize: 12)),
              ],
            ),
            const SizedBox(height: 20),

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
                  child: Container(
                    key: ValueKey(_showBack),
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: _showBack ? Theme.of(context).cardColor : AppTheme.primaryIndigo,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _showBack ? AppTheme.accentCyan : Colors.white24, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: (_showBack ? AppTheme.accentCyan : AppTheme.primaryIndigo).withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
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
                          _showBack ? card["back"]! : card["front"]!,
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

            const SizedBox(height: 24),

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
      ),
    );
  }
}
