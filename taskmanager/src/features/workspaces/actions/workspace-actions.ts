"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireWorkspace } from "@/core/auth/session";
import { getDb, ensureDatabaseSchema } from "@/core/db";
import {
  workspaces,
  workspaceMembers,
  users,
  projects,
  sprints,
  semesters,
  courses,
  tasks,
  habits,
  goals,
  keyResults,
} from "@/core/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUserWorkspaces() {
  const user = await requireAuth();
  await ensureDatabaseSchema();
  const db = getDb();

  const userMemberships = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      mode: workspaces.mode,
      avatarUrl: workspaces.avatarUrl,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id));

  return userMemberships;
}

export async function createWorkspace(data: {
  name: string;
  mode: "developer" | "student" | "both";
  templateId?: string;
}) {
  const user = await requireAuth();
  await ensureDatabaseSchema();
  const db = getDb();

  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: data.name,
      slug,
      mode: data.mode,
      createdBy: user.id,
    })
    .returning();

  // Add user as owner
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: "owner",
  });

  // Set as default workspace
  await db
    .update(users)
    .set({ defaultWorkspaceId: workspace.id })
    .where(eq(users.id, user.id));

  // If template selected, apply template seed
  if (data.templateId) {
    await applyTemplateToWorkspace(workspace.id, user.id, data.templateId);
  }

  revalidatePath("/", "layout");
  return workspace;
}

export async function switchWorkspace(workspaceId: string) {
  const user = await requireAuth();
  await ensureDatabaseSchema();
  const db = getDb();

  // Validate membership
  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership) {
    throw new Error("You do not have access to this workspace");
  }

  await db
    .update(users)
    .set({ defaultWorkspaceId: workspaceId })
    .where(eq(users.id, user.id));

  revalidatePath("/", "layout");
  return { success: true, workspaceId };
}

export async function updateWorkspaceMode(
  workspaceId: string,
  mode: "developer" | "student" | "both"
) {
  await requireWorkspace(workspaceId, ["owner", "admin"]);
  const db = getDb();

  await db
    .update(workspaces)
    .set({ mode, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));

  revalidatePath("/", "layout");
  return { success: true };
}

async function applyTemplateToWorkspace(
  workspaceId: string,
  userId: string,
  templateId: string
) {
  const db = getDb();
  const now = new Date();

  if (templateId === "semester-setup" || templateId === "exam-prep-2-weeks") {
    const [sem] = await db
      .insert(semesters)
      .values({
        workspaceId,
        name: "Current Semester",
        season: "fall",
        year: now.getFullYear(),
        isCurrent: true,
      })
      .returning();

    const [c1] = await db
      .insert(courses)
      .values({
        workspaceId,
        semesterId: sem.id,
        code: "CSE 301",
        name: "Operating Systems",
        credits: "3.0",
        color: "#06b6d4",
      })
      .returning();

    await db.insert(tasks).values([
      {
        workspaceId,
        courseId: c1.id,
        title: "Review Syllabus & Set Up Course Lab Environment",
        type: "reading",
        status: "todo",
        priority: "high",
        createdBy: userId,
      },
    ]);
  }

  if (templateId === "sprint-planning" || templateId === "hackathon-weekend") {
    const [proj] = await db
      .insert(projects)
      .values({
        workspaceId,
        key: "PRJ",
        name: "Core MVP",
        status: "active",
        color: "#6366f1",
        createdBy: userId,
      })
      .returning();

    const [spr] = await db
      .insert(sprints)
      .values({
        workspaceId,
        projectId: proj.id,
        name: "Sprint 1",
        sprintNumber: 1,
        status: "active",
        startDate: now,
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      })
      .returning();

    await db.insert(tasks).values([
      {
        workspaceId,
        projectId: proj.id,
        sprintId: spr.id,
        title: "Project Initialization & Architecture Blueprint",
        type: "feature",
        status: "in_progress",
        priority: "urgent",
        storyPoints: "5.0",
        createdBy: userId,
      },
    ]);
  }

  if (templateId === "job-internship-hunt") {
    await db.insert(habits).values({
      workspaceId,
      userId,
      title: "Solve 2 LeetCode / DSA Problems",
      category: "coding",
      frequency: "daily",
      targetDaysPerWeek: 7,
    });

    const [goal] = await db
      .insert(goals)
      .values({
        workspaceId,
        userId,
        title: "Pass SWE Technical Interviews",
        mode: "developer",
        status: "in_progress",
      })
      .returning();

    await db.insert(keyResults).values({
      goalId: goal.id,
      title: "Solve 150 Medium/Hard LeetCode problems",
      initialValue: "0",
      currentValue: "20",
      targetValue: "150",
      unit: "problems",
    });
  }
}
