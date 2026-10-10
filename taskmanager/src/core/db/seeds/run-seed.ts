import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
import { getDb, ensureDatabaseSchema } from "../index";
import {
  users,
  workspaces,
  workspaceMembers,
  projects,
  sprints,
  semesters,
  courses,
  classSchedules,
  syllabusTopics,
  assignments,
  exams,
  grades,
  tasks,
  subtasks,
  labels,
  taskLabels,
  comments,
  studySessions,
  flashcardDecks,
  flashcards,
  habits,
  habitLogs,
  goals,
  keyResults,
} from "../schema";

export async function runSeed() {
  console.log("🌱 Starting DevFlow database seed...");
  await ensureDatabaseSchema();
  const db = getDb();

  const hashedPassword = await argon2.hash("Password123!");

  // 1. Users
  console.log("👤 Creating demo users...");
  const [alex] = await db
    .insert(users)
    .values({
      name: "Alex Chen",
      email: "alex@devflow.local",
      passwordHash: hashedPassword,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: "Alex Chen", passwordHash: hashedPassword },
    })
    .returning();

  const [maya] = await db
    .insert(users)
    .values({
      name: "Maya Patel",
      email: "maya@devflow.local",
      passwordHash: hashedPassword,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name: "Maya Patel", passwordHash: hashedPassword },
    })
    .returning();

  // 2. Workspace
  console.log("🏢 Creating workspace...");
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "DevFlow HQ & CS Hub",
      slug: "devflow-hub",
      mode: "both",
      createdBy: alex.id,
    })
    .onConflictDoUpdate({
      target: workspaces.slug,
      set: { name: "DevFlow HQ & CS Hub", mode: "both" },
    })
    .returning();

  // Set default workspace for users
  await db
    .update(users)
    .set({ defaultWorkspaceId: workspace.id })
    .where(eq(users.id, alex.id));
  await db
    .update(users)
    .set({ defaultWorkspaceId: workspace.id })
    .where(eq(users.id, maya.id));

  // 3. Workspace Members
  await db
    .insert(workspaceMembers)
    .values([
      { workspaceId: workspace.id, userId: alex.id, role: "owner" },
      { workspaceId: workspace.id, userId: maya.id, role: "member" },
    ])
    .onConflictDoNothing();

  // 4. Labels
  console.log("🏷️ Creating labels...");
  const [frontendLabel] = await db
    .insert(labels)
    .values({
      workspaceId: workspace.id,
      name: "Frontend",
      color: "#3b82f6",
      description: "UI and UX tasks",
    })
    .returning();

  const [systemsLabel] = await db
    .insert(labels)
    .values({
      workspaceId: workspace.id,
      name: "Systems",
      color: "#06b6d4",
      description: "OS, Memory, Low-level",
    })
    .returning();

  const [algorithmsLabel] = await db
    .insert(labels)
    .values({
      workspaceId: workspace.id,
      name: "Algorithms",
      color: "#8b5cf6",
      description: "DSA & Theory",
    })
    .returning();

  // 5. Developer Mode: Projects & Sprints
  console.log("💻 Creating developer project & sprints...");
  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace.id,
      key: "DF",
      name: "DevFlow Core Platform",
      description: "End-to-end task and academic operating system for modern engineers",
      status: "active",
      color: "#6366f1",
      createdBy: alex.id,
    })
    .returning();

  const now = new Date();
  const sprintStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const sprintEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  const [sprint1] = await db
    .insert(sprints)
    .values({
      workspaceId: workspace.id,
      projectId: project.id,
      name: "Sprint 1: Core Engine & Views",
      sprintNumber: 1,
      goal: "Ship full Kanban board, unified task engine, and semester tracking",
      startDate: sprintStart,
      endDate: sprintEnd,
      status: "active",
      totalStoryPoints: 34,
      completedStoryPoints: 18,
    })
    .returning();

  // 6. Student Mode: Semesters & Courses
  console.log("🎓 Creating student semester, courses & timetable...");
  const [semester] = await db
    .insert(semesters)
    .values({
      workspaceId: workspace.id,
      name: "Fall 2026",
      season: "fall",
      year: 2026,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-20"),
      isCurrent: true,
    })
    .returning();

  const [courseOS] = await db
    .insert(courses)
    .values({
      workspaceId: workspace.id,
      semesterId: semester.id,
      code: "CSE 301",
      name: "Operating Systems",
      credits: "3.0",
      instructorName: "Dr. Aris Thorne",
      instructorEmail: "thorne@university.edu",
      color: "#06b6d4",
      targetGrade: "A",
    })
    .returning();

  const [courseDSA] = await db
    .insert(courses)
    .values({
      workspaceId: workspace.id,
      semesterId: semester.id,
      code: "CSE 302",
      name: "Design & Analysis of Algorithms",
      credits: "3.0",
      instructorName: "Prof. Sarah Connor",
      instructorEmail: "connor@university.edu",
      color: "#8b5cf6",
      targetGrade: "A",
    })
    .returning();

  // Timetable
  await db.insert(classSchedules).values([
    {
      courseId: courseOS.id,
      dayOfWeek: "monday",
      startTime: "10:00",
      endTime: "11:30",
      location: "Hall B / Room 402",
    },
    {
      courseId: courseOS.id,
      dayOfWeek: "wednesday",
      startTime: "10:00",
      endTime: "11:30",
      location: "Hall B / Room 402",
    },
    {
      courseId: courseDSA.id,
      dayOfWeek: "tuesday",
      startTime: "14:00",
      endTime: "15:30",
      location: "CS Building Room 305",
    },
    {
      courseId: courseDSA.id,
      dayOfWeek: "thursday",
      startTime: "14:00",
      endTime: "15:30",
      location: "CS Building Room 305",
    },
  ]);

  // Syllabus Topics
  await db.insert(syllabusTopics).values([
    {
      courseId: courseOS.id,
      title: "Process Scheduling & Threads",
      description: "Preemptive scheduling, MLFQ, CFS, POSIX threads",
      orderIndex: 1,
      status: "mastered",
    },
    {
      courseId: courseOS.id,
      title: "Virtual Memory & Page Replacement",
      description: "Paging, segmentation, TLB shootdown, LRU clock algorithm",
      orderIndex: 2,
      status: "studying",
    },
    {
      courseId: courseDSA.id,
      title: "Dynamic Programming & Memoization",
      description: "Optimal substructure, knapsack, edit distance, interval DP",
      orderIndex: 1,
      status: "studying",
    },
  ]);

  // Assignments & Exams
  const assignmentDueDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  await db.insert(assignments).values([
    {
      workspaceId: workspace.id,
      courseId: courseOS.id,
      title: "MLFQ Scheduler Implementation in C",
      weightPercentage: "15.00",
      maxScore: "100.00",
      dueDate: assignmentDueDate,
      isGroupProject: false,
    },
    {
      workspaceId: workspace.id,
      courseId: courseDSA.id,
      title: "Graph Algorithms Benchmark & Analysis",
      weightPercentage: "10.00",
      maxScore: "100.00",
      earnedScore: "96.00",
      dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      isGroupProject: true,
    },
  ]);

  const examDate = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
  await db.insert(exams).values([
    {
      workspaceId: workspace.id,
      courseId: courseOS.id,
      name: "Midterm Examination",
      weightPercentage: "25.00",
      examDate,
      durationMinutes: 120,
      roomLocation: "Auditorium East",
      maxScore: "100.00",
    },
  ]);

  // 7. Unified Tasks (Developer + Student + General)
  console.log("📝 Populating unified tasks...");
  const [task1] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      projectId: project.id,
      sprintId: sprint1.id,
      title: "Implement drag-and-drop Kanban board with @dnd-kit",
      description: "Build interactive columns for backlog, todo, in_progress, and done with instant optimistic state.",
      type: "feature",
      status: "in_progress",
      priority: "high",
      storyPoints: "5.0",
      estimatedMinutes: 240,
      actualMinutes: 180,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdBy: alex.id,
    })
    .returning();

  const [task2] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      courseId: courseOS.id,
      title: "Submit MLFQ CPU Scheduler assignment and write documentation",
      description: "Complete priority boost timer and queue starvation edge cases. Test with xv6 simulator.",
      type: "assignment",
      status: "in_progress",
      priority: "urgent",
      estimatedMinutes: 300,
      actualMinutes: 120,
      academicWeight: "15.00",
      dueDate: assignmentDueDate,
      createdBy: alex.id,
    })
    .returning();

  const [task3] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      projectId: project.id,
      sprintId: sprint1.id,
      title: "Resolve optimistic concurrency conflict handling (version column)",
      description: "Add version check in update mutation with 409 conflict detection toast.",
      type: "bug",
      status: "in_review",
      priority: "urgent",
      storyPoints: "3.0",
      estimatedMinutes: 120,
      actualMinutes: 110,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      createdBy: alex.id,
    })
    .returning();

  const [task4] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      courseId: courseDSA.id,
      title: "Solve 10 Dynamic Programming LeetCode problems for Algorithms viva",
      description: "Focus on Longest Common Subsequence, Coin Change 2, and Matrix Chain Multiplication.",
      type: "viva_prep",
      status: "todo",
      priority: "high",
      estimatedMinutes: 180,
      actualMinutes: 0,
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdBy: alex.id,
    })
    .returning();

  const [task5] = await db
    .insert(tasks)
    .values({
      workspaceId: workspace.id,
      projectId: project.id,
      sprintId: sprint1.id,
      title: "Architect PostgreSQL schema and Neon connection pooling",
      description: "Modular schemas with 40 tables, Drizzle ORM, and automated migration scripts.",
      type: "chore",
      status: "done",
      priority: "high",
      storyPoints: "5.0",
      estimatedMinutes: 180,
      actualMinutes: 160,
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdBy: alex.id,
    })
    .returning();

  // Attach Labels
  await db.insert(taskLabels).values([
    { taskId: task1.id, labelId: frontendLabel.id },
    { taskId: task2.id, labelId: systemsLabel.id },
    { taskId: task4.id, labelId: algorithmsLabel.id },
  ]);

  // Subtasks
  await db.insert(subtasks).values([
    { taskId: task2.id, title: "Implement 3-level priority queues", isCompleted: true, sortOrder: 1 },
    { taskId: task2.id, title: "Write periodic priority boost routine", isCompleted: true, sortOrder: 2 },
    { taskId: task2.id, title: "Benchmark context switch overhead vs Round Robin", isCompleted: false, sortOrder: 3 },
  ]);

  // Comments
  await db.insert(comments).values([
    {
      workspaceId: workspace.id,
      taskId: task1.id,
      userId: maya.id,
      content: "Great progress on the drag handle! Smooth animations on column drop.",
    },
  ]);

  // 8. Flashcards & Spaced Repetition (SM-2)
  console.log("🗂️ Adding flashcard deck & cards...");
  const [deck] = await db
    .insert(flashcardDecks)
    .values({
      workspaceId: workspace.id,
      courseId: courseOS.id,
      title: "Operating Systems Fundamentals",
      description: "Core concepts for Midterm & Final examinations",
    })
    .returning();

  await db.insert(flashcards).values([
    {
      deckId: deck.id,
      front: "What is the primary difference between paging and segmentation?",
      back: "Paging divides physical/virtual memory into fixed-size frames and pages. Segmentation divides logical address space into variable-sized semantic segments (code, data, stack).",
      repetitions: 2,
      intervalDays: 6,
      easeFactor: "2.50",
      nextReviewDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      deckId: deck.id,
      front: "What causes a Translation Lookaside Buffer (TLB) shootdown?",
      back: "Occurs in multiprocessor systems when a page table entry is modified on one CPU core, forcing an inter-processor interrupt to invalidate stale TLBs on all other cores.",
      repetitions: 1,
      intervalDays: 1,
      easeFactor: "2.50",
      nextReviewDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
  ]);

  // 9. Habits
  console.log("⚡ Creating habits and logs...");
  const [habit1] = await db
    .insert(habits)
    .values({
      workspaceId: workspace.id,
      userId: alex.id,
      title: "LeetCode 2 Problems Daily",
      category: "coding",
      frequency: "daily",
      targetDaysPerWeek: 7,
      currentStreak: 14,
      longestStreak: 21,
    })
    .returning();

  const [habit2] = await db
    .insert(habits)
    .values({
      workspaceId: workspace.id,
      userId: alex.id,
      title: "Daily CSE Lecture Revision",
      category: "academics",
      frequency: "daily",
      targetDaysPerWeek: 5,
      currentStreak: 5,
      longestStreak: 12,
    })
    .returning();

  // 10. Goals & OKRs
  console.log("🎯 Adding Goals and Key Results...");
  const [goal] = await db
    .insert(goals)
    .values({
      workspaceId: workspace.id,
      userId: alex.id,
      title: "Achieve 3.9+ GPA & Ship DevFlow v1.0",
      mode: "both",
      targetDate: new Date("2026-12-31"),
      status: "in_progress",
      progressPercentage: "68.00",
    })
    .returning();

  await db.insert(keyResults).values([
    {
      goalId: goal.id,
      title: "Maintain > 90% in all CSE assignments and labs",
      initialValue: "0",
      currentValue: "95",
      targetValue: "100",
      unit: "%",
    },
    {
      goalId: goal.id,
      title: "Complete 25 DevFlow sprint stories with tests",
      initialValue: "0",
      currentValue: "18",
      targetValue: "25",
      unit: "stories",
    },
  ]);

  console.log("✅ DevFlow database seed completed successfully!");
  console.log("👉 Login credentials: alex@devflow.local / Password123!");
}

if (require.main === module || process.argv[1]?.includes("run-seed")) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
