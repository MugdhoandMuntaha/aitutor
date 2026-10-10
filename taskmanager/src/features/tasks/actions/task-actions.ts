"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/core/auth/session";
import { getDb, ensureDatabaseSchema } from "@/core/db";
import {
  tasks,
  subtasks,
  labels,
  taskLabels,
  comments,
  activityLogs,
  projects,
  courses,
  users,
} from "@/core/db/schema";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { createTaskSchema, updateTaskSchema } from "../validation";
import { TaskWithRelations, SubtaskItem, LabelItem, CommentItem } from "../types";

export async function getWorkspaceTasks(options?: {
  modeFilter?: "all" | "developer" | "student";
  projectId?: string;
  courseId?: string;
  status?: string;
  priority?: string;
  search?: string;
}): Promise<TaskWithRelations[]> {
  const ws = await requireWorkspace();
  await ensureDatabaseSchema();
  const db = getDb();

  // Query base tasks
  const rawTasks = await db
    .select({
      task: tasks,
      projectName: projects.name,
      projectKey: projects.key,
      courseCode: courses.code,
      courseName: courses.name,
      courseColor: courses.color,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(
      and(
        eq(tasks.workspaceId, ws.workspaceId),
        isNull(tasks.deletedAt)
      )
    )
    .orderBy(tasks.sortOrder, desc(tasks.createdAt));

  if (rawTasks.length === 0) {
    return [];
  }

  const taskIds = rawTasks.map((r: { task: { id: string } }) => r.task.id);

  // Fetch subtasks
  const rawSubtasks = await db
    .select()
    .from(subtasks)
    .where(inArray(subtasks.taskId, taskIds))
    .orderBy(subtasks.sortOrder);

  // Fetch labels
  const rawTaskLabels = await db
    .select({
      taskId: taskLabels.taskId,
      labelId: labels.id,
      name: labels.name,
      color: labels.color,
      description: labels.description,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(inArray(taskLabels.taskId, taskIds));

  // Group subtasks & labels by taskId
  const subtasksMap = new Map<string, SubtaskItem[]>();
  for (const st of rawSubtasks) {
    const list = subtasksMap.get(st.taskId) || [];
    list.push(st as SubtaskItem);
    subtasksMap.set(st.taskId, list);
  }

  const labelsMap = new Map<string, LabelItem[]>();
  for (const tl of rawTaskLabels) {
    const list = labelsMap.get(tl.taskId) || [];
    list.push({
      id: tl.labelId,
      name: tl.name,
      color: tl.color,
      description: tl.description,
    });
    labelsMap.set(tl.taskId, list);
  }

  // Combine results
  const result: TaskWithRelations[] = rawTasks.map((r: any) => ({
    ...r.task,
    projectName: r.projectName,
    projectKey: r.projectKey,
    courseCode: r.courseCode,
    courseName: r.courseName,
    courseColor: r.courseColor,
    subtasks: subtasksMap.get(r.task.id) || [],
    labels: labelsMap.get(r.task.id) || [],
  }));

  // Apply optional memory filters if requested
  let filtered = result;
  if (options?.modeFilter === "developer") {
    filtered = filtered.filter((t) => t.projectId || !t.courseId);
  } else if (options?.modeFilter === "student") {
    filtered = filtered.filter((t) => t.courseId || !t.projectId);
  }

  if (options?.projectId) {
    filtered = filtered.filter((t) => t.projectId === options.projectId);
  }
  if (options?.courseId) {
    filtered = filtered.filter((t) => t.courseId === options.courseId);
  }
  if (options?.status && options.status !== "all") {
    filtered = filtered.filter((t) => t.status === options.status);
  }
  if (options?.priority && options.priority !== "all") {
    filtered = filtered.filter((t) => t.priority === options.priority);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export async function getTaskById(taskId: string): Promise<TaskWithRelations | null> {
  const ws = await requireWorkspace();
  const db = getDb();

  const [row] = await db
    .select({
      task: tasks,
      projectName: projects.name,
      projectKey: projects.key,
      courseCode: courses.code,
      courseName: courses.name,
      courseColor: courses.color,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.workspaceId, ws.workspaceId),
        isNull(tasks.deletedAt)
      )
    )
    .limit(1);

  if (!row) return null;

  const rawSubtasks = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .orderBy(subtasks.sortOrder);

  const rawLabels = await db
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      description: labels.description,
    })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(eq(taskLabels.taskId, taskId));

  const rawComments = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      userId: comments.userId,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(eq(comments.taskId, taskId), isNull(comments.deletedAt)))
    .orderBy(desc(comments.createdAt));

  return {
    ...row.task,
    projectName: row.projectName,
    projectKey: row.projectKey,
    courseCode: row.courseCode,
    courseName: row.courseName,
    courseColor: row.courseColor,
    subtasks: rawSubtasks as SubtaskItem[],
    labels: rawLabels,
    comments: rawComments as CommentItem[],
  };
}

export async function createTask(rawInput: unknown) {
  const ws = await requireWorkspace();
  const db = getDb();

  const parsed = createTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid task input" };
  }

  const d = parsed.data;

  const [newTask] = await db
    .insert(tasks)
    .values({
      workspaceId: ws.workspaceId,
      title: d.title,
      description: d.description || "",
      type: d.type as any,
      status: d.status as any,
      priority: d.priority as any,
      projectId: d.projectId || null,
      courseId: d.courseId || null,
      sprintId: d.sprintId || null,
      storyPoints: d.storyPoints || null,
      estimatedMinutes: d.estimatedMinutes || null,
      actualMinutes: d.actualMinutes || 0,
      startDate: d.startDate ? new Date(d.startDate) : null,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      academicWeight: d.academicWeight || null,
      githubIssueUrl: d.githubIssueUrl || null,
      githubPrUrl: d.githubPrUrl || null,
      branchName: d.branchName || null,
      createdBy: ws.userId,
      version: 1,
    })
    .returning();

  // Attach labels if provided
  if (d.labelIds && d.labelIds.length > 0) {
    await db.insert(taskLabels).values(
      d.labelIds.map((lId) => ({
        taskId: newTask.id,
        labelId: lId,
      }))
    );
  }

  // Audit log
  await db.insert(activityLogs).values({
    workspaceId: ws.workspaceId,
    userId: ws.userId,
    entityType: "task",
    entityId: newTask.id,
    action: "created",
    diffPayload: { title: newTask.title, status: newTask.status },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true, task: newTask };
}

export async function updateTask(rawInput: unknown) {
  const ws = await requireWorkspace();
  const db = getDb();

  const parsed = updateTaskSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid update input" };
  }

  const d = parsed.data;

  // Retrieve current task to verify version & workspace ownership
  const [current] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, d.id), eq(tasks.workspaceId, ws.workspaceId)))
    .limit(1);

  if (!current) {
    return { error: "Task not found or access denied" };
  }

  // Optimistic concurrency check
  if (d.expectedVersion && current.version !== d.expectedVersion) {
    return {
      conflict: true,
      error: "This task was modified in another window. Please refresh before saving.",
      currentVersion: current.version,
    };
  }

  const updateFields: any = {
    updatedAt: new Date(),
    version: current.version + 1,
  };

  if (d.title !== undefined) updateFields.title = d.title;
  if (d.description !== undefined) updateFields.description = d.description;
  if (d.type !== undefined) updateFields.type = d.type;
  if (d.status !== undefined) {
    updateFields.status = d.status;
    if (d.status === "done" && current.status !== "done") {
      updateFields.completedAt = new Date();
    } else if (d.status !== "done" && current.status === "done") {
      updateFields.completedAt = null;
    }
  }
  if (d.priority !== undefined) updateFields.priority = d.priority;
  if (d.projectId !== undefined) updateFields.projectId = d.projectId;
  if (d.courseId !== undefined) updateFields.courseId = d.courseId;
  if (d.sprintId !== undefined) updateFields.sprintId = d.sprintId;
  if (d.storyPoints !== undefined) updateFields.storyPoints = d.storyPoints;
  if (d.estimatedMinutes !== undefined) updateFields.estimatedMinutes = d.estimatedMinutes;
  if (d.actualMinutes !== undefined) updateFields.actualMinutes = d.actualMinutes;
  if (d.startDate !== undefined) updateFields.startDate = d.startDate ? new Date(d.startDate) : null;
  if (d.dueDate !== undefined) updateFields.dueDate = d.dueDate ? new Date(d.dueDate) : null;
  if (d.academicWeight !== undefined) updateFields.academicWeight = d.academicWeight;
  if (d.githubIssueUrl !== undefined) updateFields.githubIssueUrl = d.githubIssueUrl;
  if (d.githubPrUrl !== undefined) updateFields.githubPrUrl = d.githubPrUrl;
  if (d.branchName !== undefined) updateFields.branchName = d.branchName;

  const [updated] = await db
    .update(tasks)
    .set(updateFields)
    .where(and(eq(tasks.id, d.id), eq(tasks.workspaceId, ws.workspaceId)))
    .returning();

  // Audit log
  await db.insert(activityLogs).values({
    workspaceId: ws.workspaceId,
    userId: ws.userId,
    entityType: "task",
    entityId: d.id,
    action: "updated",
    diffPayload: updateFields,
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true, task: updated };
}

export async function updateTaskStatus(
  taskId: string,
  newStatus: string,
  sortOrder?: number
) {
  const ws = await requireWorkspace();
  const db = getDb();

  const updatePayload: any = {
    status: newStatus,
    updatedAt: new Date(),
    ...(newStatus === "done" ? { completedAt: new Date() } : { completedAt: null }),
  };

  if (sortOrder !== undefined) {
    updatePayload.sortOrder = sortOrder;
  }

  const [updated] = await db
    .update(tasks)
    .set(updatePayload)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, ws.workspaceId)))
    .returning();

  // Audit log
  await db.insert(activityLogs).values({
    workspaceId: ws.workspaceId,
    userId: ws.userId,
    entityType: "task",
    entityId: taskId,
    action: "status_changed",
    diffPayload: { status: newStatus },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true, task: updated };
}

export async function deleteTask(taskId: string) {
  const ws = await requireWorkspace();
  const db = getDb();

  await db
    .update(tasks)
    .set({ deletedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, ws.workspaceId)));

  await db.insert(activityLogs).values({
    workspaceId: ws.workspaceId,
    userId: ws.userId,
    entityType: "task",
    entityId: taskId,
    action: "deleted",
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

// Subtasks
export async function createSubtask(taskId: string, title: string) {
  await requireWorkspace();
  const db = getDb();

  const [sub] = await db
    .insert(subtasks)
    .values({
      taskId,
      title,
      isCompleted: false,
    })
    .returning();

  revalidatePath("/tasks");
  return { success: true, subtask: sub };
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  await requireWorkspace();
  const db = getDb();

  const [sub] = await db
    .update(subtasks)
    .set({ isCompleted, updatedAt: new Date() })
    .where(eq(subtasks.id, subtaskId))
    .returning();

  revalidatePath("/tasks");
  return { success: true, subtask: sub };
}

export async function deleteSubtask(subtaskId: string) {
  await requireWorkspace();
  const db = getDb();

  await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
  revalidatePath("/tasks");
  return { success: true };
}

// Comments
export async function addComment(taskId: string, content: string) {
  const ws = await requireWorkspace();
  const db = getDb();

  const [comment] = await db
    .insert(comments)
    .values({
      workspaceId: ws.workspaceId,
      taskId,
      userId: ws.userId,
      content,
    })
    .returning();

  revalidatePath("/tasks");
  return { success: true, comment };
}

// Labels
export async function getWorkspaceLabels() {
  const ws = await requireWorkspace();
  const db = getDb();

  return db.select().from(labels).where(eq(labels.workspaceId, ws.workspaceId));
}

export async function createLabel(name: string, color: string, description?: string) {
  const ws = await requireWorkspace();
  const db = getDb();

  const [newLabel] = await db
    .insert(labels)
    .values({
      workspaceId: ws.workspaceId,
      name,
      color,
      description,
    })
    .returning();

  revalidatePath("/tasks");
  return newLabel;
}

export async function attachLabel(taskId: string, labelId: string) {
  await requireWorkspace();
  const db = getDb();

  await db.insert(taskLabels).values({ taskId, labelId }).onConflictDoNothing();
  revalidatePath("/tasks");
  return { success: true };
}

export async function removeLabel(taskId: string, labelId: string) {
  await requireWorkspace();
  const db = getDb();

  await db
    .delete(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

  revalidatePath("/tasks");
  return { success: true };
}
