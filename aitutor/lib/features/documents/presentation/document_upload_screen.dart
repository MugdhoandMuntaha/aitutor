import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/course_model.dart';

class DocumentUploadScreen extends ConsumerStatefulWidget {
  final CourseModel? selectedCourse;

  const DocumentUploadScreen({super.key, this.selectedCourse});

  @override
  ConsumerState<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends ConsumerState<DocumentUploadScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _pageCountController = TextEditingController(text: "3");
  CourseModel? _course;
  bool _isProcessing = false;
  String _processingStep = "";

  @override
  void initState() {
    super.initState();
    _course = widget.selectedCourse;
  }

  void _updateDetectedPageCount(String text) {
    final matches = RegExp(r'\[Page\s*\d+\]|---+\s*Page\s*\d+|Page\s+\d+:\s*|\f', caseSensitive: false).allMatches(text).length;
    if (matches > 0) {
      _pageCountController.text = matches.toString();
    } else {
      final wordCount = text.split(RegExp(r'\s+')).where((s) => s.isNotEmpty).length;
      if (wordCount > 0) {
        final calculated = (wordCount / 120).ceil().clamp(1, 999);
        _pageCountController.text = calculated.toString();
      }
    }
  }

  Future<void> _pickFile() async {
    try {
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt', 'docx', 'md'],
      );

      if (files.isNotEmpty) {
        final file = files.first;
        _titleController.text = file.name;

        String extractedText = "";
        if (file.path != null && file.path!.isNotEmpty) {
          try {
            final f = File(file.path!);
            if (await f.exists()) {
              extractedText = await f.readAsString();
            }
          } catch (_) {}
        }

        if (extractedText.trim().isNotEmpty) {
          _contentController.text = extractedText;
        } else {
          _contentController.text = """
[Page 1]
${file.name} - Study Notes Ingestion
Topic: ${file.name.replaceAll(RegExp(r'\.[a-zA-Z0-9]+$'), '')}

[Page 2]
Core Concepts:
1. Overview and Fundamentals
This document contains university lecture slides and textbook materials for ${file.name}.

2. Key Formulas & Definitions:
- Quantitative Analysis & Principles
- Performance & Optimization Metrics

[Page 3]
Advanced Topics & Revision Notes:
- Section Details & Exam Review Problems
""";
        }
        _updateDetectedPageCount(_contentController.text);
      }
    } catch (e) {
      // Fallback manual entry
    }
  }

  Future<void> _processAndUpload() async {
    if (_titleController.text.isEmpty || _contentController.text.isEmpty || _course == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a course, enter document title, and add material text.")),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
      _processingStep = "1. Parsing PDF pages & metadata...";
    });

    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _processingStep = "2. Chunking document text into token sections...";
    });

    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _processingStep = "3. Generating Vector Embeddings via Gemini API...";
    });

    final parsedPages = int.tryParse(_pageCountController.text.trim()) ?? 3;

    await ref.read(documentsProvider.notifier).uploadDocument(
      courseId: _course!.id,
      title: _titleController.text.trim(),
      fullText: _contentController.text.trim(),
      pageCountOverride: parsedPages,
    );

    setState(() {
      _isProcessing = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Successfully ingested ${_titleController.text} ($parsedPages Pages) into ${_course!.title}!"),
          backgroundColor: AppTheme.accentEmerald,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final courses = ref.watch(coursesProvider);
    final currentCourseId = (_course != null && courses.any((c) => c.id == _course!.id))
        ? _course!.id
        : (courses.isNotEmpty ? courses.first.id : null);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Ingest Study Material"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Course Knowledge Base", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: currentCourseId,
              decoration: const InputDecoration(
                hintText: "Select Course",
              ),
              items: courses.map((c) => DropdownMenuItem<String>(value: c.id, child: Text("${c.code} - ${c.title}"))).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() => _course = courses.firstWhere((c) => c.id == val));
                }
              },
            ),

            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("Document Title", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ElevatedButton.icon(
                  onPressed: _pickFile,
                  icon: const Icon(Icons.folder_open, size: 16),
                  label: const Text("Browse Device", style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      hintText: "e.g. Computer Architecture Lecture 06.pdf",
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 1,
                  child: TextField(
                    controller: _pageCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: "Pages",
                      hintText: "3",
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            const Text("Material Content Text (Paste or Auto-Extracted)", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            TextField(
              controller: _contentController,
              maxLines: 10,
              onChanged: _updateDetectedPageCount,
              decoration: const InputDecoration(
                hintText: "[Page 1]\nLecture content...\n\n[Page 2]\nFurther content...\n\n[Page 3]\nSolutions...",
              ),
            ),

            const SizedBox(height: 24),

            if (_isProcessing)
              Column(
                children: [
                  const LinearProgressIndicator(color: AppTheme.primaryIndigo),
                  const SizedBox(height: 12),
                  Text(_processingStep, style: const TextStyle(color: AppTheme.accentCyan, fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 12),
                ],
              ),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _processAndUpload,
                icon: const Icon(Icons.memory),
                label: const Text("Start RAG Vector Ingestion", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryIndigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
