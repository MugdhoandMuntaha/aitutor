import { Suspense } from "react";
import { requireWorkspace } from "@/core/auth/session";
import { getDb } from "@/core/db";
import { projects, courses, labels } from "@/core/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getWorkspaceTasks } from "@/features/tasks/actions/task-actions";
import { TaskBoardContainer } from "@/features/tasks/components/task-board-container";
import { ViewMode } from "@/features/tasks/types";

export const instant = false;

interface TasksPageProps {
  searchParams: Promise<{
    view?: ViewMode;
    selected?: string;
  }>;
}

async function TasksLoader({ searchParams }: TasksPageProps) {
  const ws = await requireWorkspace();
  const db = getDb();
  const params = await searchParams;

  const [taskList, workspaceProjects, workspaceCourses, workspaceLabels] =
    await Promise.all([
      getWorkspaceTasks(),
      db
        .select({ id: projects.id, name: projects.name, key: projects.key })
        .from(projects)
        .where(and(eq(projects.workspaceId, ws.workspaceId), isNull(projects.deletedAt))),
      db
        .select({ id: courses.id, name: courses.name, code: courses.code, color: courses.color })
        .from(courses)
        .where(and(eq(courses.workspaceId, ws.workspaceId), isNull(courses.deletedAt))),
      db
        .select({ id: labels.id, name: labels.name, color: labels.color, description: labels.description })
        .from(labels)
        .where(eq(labels.workspaceId, ws.workspaceId)),
    ]);

  return (
    <TaskBoardContainer
      initialTasks={taskList}
      workspaceProjects={workspaceProjects}
      workspaceCourses={workspaceCourses}
      workspaceLabels={workspaceLabels}
      defaultView={params.view || "kanban"}
      initialSelectedTaskId={params.selected}
    />
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-800/60 rounded-xl" />
      <div className="h-16 w-full bg-slate-900/60 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-96 bg-slate-900/40 rounded-2xl border border-slate-800/60" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage(props: TasksPageProps) {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <TasksLoader {...props} />
    </Suspense>
  );
}
