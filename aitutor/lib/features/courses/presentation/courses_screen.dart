import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/app_providers.dart';
import '../../../shared/models/course_model.dart';
import '../../../shared/models/document_model.dart';
import '../../../shared/widgets/glass_container.dart';
import '../../documents/presentation/document_upload_screen.dart';

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courses = ref.watch(coursesProvider);
    final documents = ref.watch(documentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Course Knowledge Bases"),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: "Add Course Base",
            onPressed: () => _showAddCourseDialog(context, ref),
          ),
        ],
      ),
      body: courses.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.folder_open, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text("No course knowledge bases found.", style: TextStyle(fontSize: 16, color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => _showAddCourseDialog(context, ref),
                    icon: const Icon(Icons.add),
                    label: const Text("Create First Course Base"),
                  ),
                ],
              ),
            )
          : ListView.builder(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 115),
              itemCount: courses.length,
              itemBuilder: (context, index) {
                final course = courses[index];
                final courseDocs = documents.where((d) => d.courseId == course.id).toList();

                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: GlassContainer(
                    borderRadius: 20,
                    blur: 16,
                    opacity: 0.15,
                    child: ExpansionTile(
                      shape: const Border(),
                      leading: CircleAvatar(
                        backgroundColor: Color(int.parse(course.colorHex.replaceAll('#', '0xff'))),
                        child: Text(
                          course.code.replaceAll(RegExp(r'[^A-Z0-9]'), ''),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                        ),
                      ),
                      title: Text("${course.code}: ${course.title}", style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text("${course.semester} • Mastery: ${course.masteryScore}%"),
                      trailing: PopupMenuButton<String>(
                        icon: const Icon(Icons.more_vert),
                        onSelected: (value) {
                          if (value == 'edit') {
                            _showEditCourseDialog(context, ref, course);
                          } else if (value == 'delete') {
                            _showDeleteCourseDialog(context, ref, course);
                          } else if (value == 'upload') {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DocumentUploadScreen(selectedCourse: course),
                              ),
                            );
                          }
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'upload',
                            child: Row(
                              children: [
                                Icon(Icons.upload_file, size: 18),
                                SizedBox(width: 8),
                                Text("Upload PDF Material"),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit, size: 18),
                                SizedBox(width: 8),
                                Text("Edit Course"),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete, size: 18, color: AppTheme.accentRose),
                                SizedBox(width: 8),
                                Text("Delete Course", style: TextStyle(color: AppTheme.accentRose)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text("Uploaded RAG Documents (${courseDocs.length})", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => DocumentUploadScreen(selectedCourse: course),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.upload_file, size: 14),
                                    label: const Text("Upload PDF", style: TextStyle(fontSize: 12)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryIndigo,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              if (courseDocs.isEmpty)
                                const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: Text(
                                    "No documents uploaded for this course yet. Tap 'Upload PDF' to ingest lecture notes, slides, or textbooks.",
                                    style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic),
                                  ),
                                )
                              else
                                ...courseDocs.map((doc) => Material(
                                  color: Colors.transparent,
                                  child: ListTile(
                                    dense: true,
                                    leading: const Icon(Icons.picture_as_pdf, color: Colors.redAccent, size: 20),
                                    title: Text(doc.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    subtitle: Text("${doc.pageCount} Pages • ${doc.chunkCount} RAG Chunks"),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        TextButton(
                                          onPressed: () {
                                            ref.read(selectedCourseProvider.notifier).state = course;
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text("Selected ${course.title} as active context for AI Tutor")),
                                            );
                                          },
                                          child: const Text("Set Context", style: TextStyle(fontSize: 11)),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.grey),
                                          tooltip: "Edit Page Count & Title",
                                          onPressed: () {
                                            _showEditDocumentDialog(context, ref, doc);
                                          },
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                                          tooltip: "Delete Document",
                                          onPressed: () {
                                            ref.read(documentsProvider.notifier).deleteDocument(doc.id);
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text("Deleted ${doc.title}")),
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                )),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showAddCourseDialog(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final codeController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Create Course Knowledge Base"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: "Course Title (e.g. Computer Networks)"),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: codeController,
              decoration: const InputDecoration(labelText: "Course Code (e.g. CSE-3107)"),
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
              if (titleController.text.isNotEmpty && codeController.text.isNotEmpty) {
                ref.read(coursesProvider.notifier).addCourse(
                  title: titleController.text.trim(),
                  code: codeController.text.trim(),
                  colorHex: '#10B981',
                );
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Course created successfully!")),
                );
              }
            },
            child: const Text("Create"),
          ),
        ],
      ),
    );
  }

  void _showEditCourseDialog(BuildContext context, WidgetRef ref, CourseModel course) {
    final titleController = TextEditingController(text: course.title);
    final codeController = TextEditingController(text: course.code);
    final masteryController = TextEditingController(text: course.masteryScore.toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Edit Course Details"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: "Course Title"),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: codeController,
              decoration: const InputDecoration(labelText: "Course Code"),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: masteryController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Mastery Level (0 - 100%)"),
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
              if (titleController.text.isNotEmpty && codeController.text.isNotEmpty) {
                final mastery = (int.tryParse(masteryController.text.trim()) ?? course.masteryScore).clamp(0, 100);
                final updated = course.copyWith(
                  title: titleController.text.trim(),
                  code: codeController.text.trim(),
                  masteryScore: mastery,
                );
                ref.read(coursesProvider.notifier).updateCourse(updated);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Course updated!")),
                );
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  void _showEditDocumentDialog(BuildContext context, WidgetRef ref, DocumentModel doc) {
    final titleController = TextEditingController(text: doc.title);
    final pagesController = TextEditingController(text: doc.pageCount.toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Edit Document Details"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: "Document Title"),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: pagesController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Page Count"),
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
              if (titleController.text.isNotEmpty) {
                final pages = int.tryParse(pagesController.text) ?? doc.pageCount;
                ref.read(documentsProvider.notifier).updateDocument(
                  id: doc.id,
                  title: titleController.text.trim(),
                  pageCount: pages,
                );
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Document updated!")),
                );
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  void _showDeleteCourseDialog(BuildContext context, WidgetRef ref, CourseModel course) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Delete ${course.title}?"),
        content: const Text("Are you sure you want to delete this course knowledge base? All associated uploaded documents will be unlinked."),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentRose),
            onPressed: () {
              ref.read(coursesProvider.notifier).deleteCourse(course.id);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Deleted ${course.title}")),
              );
            },
            child: const Text("Delete", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
