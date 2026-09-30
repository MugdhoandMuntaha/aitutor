import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_math_fork/flutter_math.dart';

/// Formatter that parses LaTeX formulas ($$...$$ and \[...\]) and renders
/// rich Markdown with clean academic typography.
/// Follows Single Responsibility Principle (SRP).
class ChatMathMarkdownViewer extends StatelessWidget {
  final String rawText;
  final Color textColor;

  const ChatMathMarkdownViewer({
    super.key,
    required this.rawText,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final RegExp blockEqRegex = RegExp(r'(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])');
    final matches = blockEqRegex.allMatches(rawText);

    if (matches.isEmpty) {
      return _buildMarkdownSegment(context, rawText, textColor);
    }

    final List<Widget> children = [];
    int lastIndex = 0;

    for (final match in matches) {
      if (match.start > lastIndex) {
        final textSegment = rawText.substring(lastIndex, match.start);
        if (textSegment.trim().isNotEmpty) {
          children.add(_buildMarkdownSegment(context, textSegment, textColor));
        }
      }

      String eqRaw = match.group(0)!;
      String texCode = eqRaw;
      if (texCode.startsWith(r'$$') && texCode.endsWith(r'$$')) {
        texCode = texCode.substring(2, texCode.length - 2).trim();
      } else if (texCode.startsWith(r'\[') && texCode.endsWith(r'\]')) {
        texCode = texCode.substring(2, texCode.length - 2).trim();
      }

      // Clean $1 artifacts if any exist
      texCode = texCode.replaceAll(r'$1', '');

      children.add(
        Container(
          width: double.infinity,
          alignment: Alignment.center,
          margin: const EdgeInsets.symmetric(vertical: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.35),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.3),
              width: 1.2,
            ),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Math.tex(
              texCode,
              textStyle: const TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
              onErrorFallback: (err) {
                return Text(
                  texCode,
                  style: const TextStyle(
                    color: Colors.white,
                    fontFamily: 'monospace',
                    fontSize: 13,
                  ),
                );
              },
            ),
          ),
        ),
      );

      lastIndex = match.end;
    }

    if (lastIndex < rawText.length) {
      final remaining = rawText.substring(lastIndex);
      if (remaining.trim().isNotEmpty) {
        children.add(_buildMarkdownSegment(context, remaining, textColor));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }

  Widget _buildMarkdownSegment(BuildContext context, String text, Color textColor) {
    final cleanedText = _cleanInlineMath(text);
    return MarkdownBody(
      data: cleanedText,
      selectable: true,
      styleSheet: MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
        p: TextStyle(color: textColor, fontSize: 14, height: 1.55),
        h1: TextStyle(color: textColor, fontSize: 18, fontWeight: FontWeight.bold),
        h2: TextStyle(color: textColor, fontSize: 16, fontWeight: FontWeight.bold),
        h3: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold),
        listBullet: TextStyle(color: textColor),
        strong: TextStyle(color: textColor, fontWeight: FontWeight.bold),
        tableHead: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 13),
        tableBody: TextStyle(color: textColor, fontSize: 13),
        tableBorder: TableBorder.all(
          color: Theme.of(context).dividerColor,
          width: 1,
        ),
        tableCellsPadding: const EdgeInsets.all(8),
        code: TextStyle(
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? Colors.white.withValues(alpha: 0.1)
              : Colors.black.withValues(alpha: 0.06),
          color: textColor,
          fontFamily: 'monospace',
          fontSize: 12.5,
        ),
      ),
    );
  }

  String _cleanInlineMath(String text) {
    if (text.isEmpty) return text;
    String s = text;

    // Convert single inline dollar math $eq$ into bold/clean notation
    s = s.replaceAllMapped(RegExp(r'\$([^$\n]+)\$'), (m) {
      String eq = m.group(1)?.trim() ?? '';
      return '**${_cleanSimpleMath(eq)}**';
    });

    // Convert \(eq\) into bold/clean notation
    s = s.replaceAllMapped(RegExp(r'\\\((.*?)\\\)'), (m) {
      String eq = m.group(1)?.trim() ?? '';
      return '**${_cleanSimpleMath(eq)}**';
    });

    return s;
  }

  String _cleanSimpleMath(String eq) {
    String s = eq;
    s = s.replaceAll(r'\to', '→');
    s = s.replaceAll(r'\rightarrow', '→');
    s = s.replaceAll(r'\approx', '≈');
    s = s.replaceAll(r'\infty', '∞');
    s = s.replaceAll(r'\times', '×');
    s = s.replaceAll(r'\cdot', '·');
    s = s.replaceAll(r'\le', '≤');
    s = s.replaceAll(r'\ge', '≥');
    s = s.replaceAll(r'\neq', '≠');
    s = s.replaceAll(r'\_', '_');
    s = s.replaceAllMapped(RegExp(r'\\text\s*\{([^}]+)\}'), (m) => m.group(1) ?? '');
    s = s.replaceAllMapped(RegExp(r'\\([a-zA-Z]+)'), (m) => m.group(1) ?? '');
    return s.replaceAll('{', '').replaceAll('}', '').trim();
  }
}
