import { requireWorkspace } from "@/core/auth/session";
import { getDb } from "@/core/db";
import { tasks, projects, courses, habits, timeEntries } from "@/core/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Flame,
  ArrowRight,
  Code2,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const instant = false;

interface TaskItem {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  estimatedMinutes: number | null;
  actualMinutes: number;
  storyPoints: string | null;
  projectId: string | null;
  courseId: string | null;
}

interface ProjectItem {
  id: string;
  name: string;
  key: string;
}

interface CourseItem {
  id: string;
  code: string;
  name: string;
  color: string;
}

export default async function DashboardPage() {
  const ws = await requireWorkspace();
  const db = getDb();
  const now = new Date();

  // Fetch active tasks for this workspace
  const workspaceTasks: TaskItem[] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      type: tasks.type,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      estimatedMinutes: tasks.estimatedMinutes,
      actualMinutes: tasks.actualMinutes,
      storyPoints: tasks.storyPoints,
      projectId: tasks.projectId,
      courseId: tasks.courseId,
    })
    .from(tasks)
    .where(and(eq(tasks.workspaceId, ws.workspaceId), isNull(tasks.deletedAt)));

  // Fetch projects and courses for mapping names
  const workspaceProjects: ProjectItem[] = await db
    .select({ id: projects.id, name: projects.name, key: projects.key })
    .from(projects)
    .where(eq(projects.workspaceId, ws.workspaceId));

  const workspaceCourses: CourseItem[] = await db
    .select({ id: courses.id, code: courses.code, name: courses.name, color: courses.color })
    .from(courses)
    .where(eq(courses.workspaceId, ws.workspaceId));

  const projectMap = new Map<string, ProjectItem>(workspaceProjects.map((p) => [p.id, p]));
  const courseMap = new Map<string, CourseItem>(workspaceCourses.map((c) => [c.id, c]));

  // Categorize tasks
  const activeTasks = workspaceTasks.filter(
    (t: TaskItem) => t.status !== "done" && t.status !== "cancelled"
  );
  const completedTasks = workspaceTasks.filter((t: TaskItem) => t.status === "done");

  const overdueTasks = activeTasks.filter(
    (t: TaskItem) => t.dueDate && new Date(t.dueDate).getTime() < now.getTime()
  );

  const upcomingDeadlines = activeTasks
    .filter((t: TaskItem) => t.dueDate && new Date(t.dueDate).getTime() >= now.getTime())
    .sort(
      (a: TaskItem, b: TaskItem) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 5);

  // "What to do next" scoring algorithm
  const scoredTasks = activeTasks.map((t: TaskItem) => {
    let score = 0;
    if (t.priority === "urgent") score += 100;
    if (t.priority === "high") score += 50;
    if (t.priority === "medium") score += 20;

    if (t.dueDate) {
      const diffMs = new Date(t.dueDate).getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours < 0) score += 150; // Overdue top priority
      else if (diffHours < 24) score += 90; // Due within 24h
      else if (diffHours < 72) score += 40; // Due within 3 days
    }

    if (t.status === "in_progress") score += 30; // Already in flight

    return { task: t, score };
  });

  scoredTasks.sort((a, b) => b.score - a.score);
  const whatToDoNext = scoredTasks[0]?.task;

  // Habits for streaks
  const workspaceHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.workspaceId, ws.workspaceId), isNull(habits.deletedAt)));

  const maxStreak = workspaceHabits.reduce(
    (acc: number, h: { currentStreak: number }) => Math.max(acc, h.currentStreak),
    0
  );

  // Time tracked today
  const timeEntriesList = await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.workspaceId, ws.workspaceId));

  const totalTrackedSeconds = timeEntriesList.reduce(
    (acc: number, e: { durationSeconds: number | null }) => acc + (e.durationSeconds || 0),
    0
  );
  const totalTrackedHours = (totalTrackedSeconds / 3600).toFixed(1);

  const completionRate =
    workspaceTasks.length > 0
      ? Math.round((completedTasks.length / workspaceTasks.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner: Welcome + What to do next */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{ws.workspaceName}</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono font-medium uppercase tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {ws.workspaceMode} Cockpit
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Here is your engineering and academic overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tasks"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
            >
              <span>View All Views</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* AI "What To Do Next" Recommendation Banner */}
        {whatToDoNext && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/60 border border-indigo-500/30 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    Recommended Next Action
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold uppercase">
                    {whatToDoNext.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">{whatToDoNext.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {whatToDoNext.dueDate
                    ? `Deadline: ${formatDate(whatToDoNext.dueDate)}`
                    : "No specific deadline set"}
                  {whatToDoNext.estimatedMinutes && ` • Est: ${whatToDoNext.estimatedMinutes}m`}
                </p>
              </div>
            </div>

            <Link
              href={`/tasks?selected=${whatToDoNext.id}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 shrink-0"
            >
              Start Focus Session
            </Link>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completionRate}%</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {completedTasks.length} of {workspaceTasks.length} tasks done
          </p>
        </div>

        {/* Overdue */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-bold ${overdueTasks.length > 0 ? "text-rose-400" : "text-white"}`}>
            {overdueTasks.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Needs urgent attention</p>
        </div>

        {/* Streaks */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Habit Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{maxStreak} days</div>
          <p className="text-[11px] text-slate-400 mt-1">Current best streak</p>
        </div>

        {/* Time Tracked */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Time Tracked</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalTrackedHours}h</div>
          <p className="text-[11px] text-slate-400 mt-1">Logged total focus</p>
        </div>
      </div>

      {/* Main Dual Columns: Active Today & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In Progress & Active Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">In Flight & Active Today</h2>
            <span className="text-xs text-slate-400">{activeTasks.length} pending</span>
          </div>

          <div className="space-y-2.5">
            {activeTasks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                All caught up! No active tasks pending.
              </div>
            ) : (
              activeTasks.slice(0, 6).map((task: TaskItem) => {
                const proj = task.projectId ? projectMap.get(task.projectId) : null;
                const course = task.courseId ? courseMap.get(task.courseId) : null;

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0 bg-indigo-500" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {proj && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">
                              <Code2 className="w-3 h-3" />
                              {proj.key}
                            </span>
                          )}
                          {course && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-medium">
                              <GraduationCap className="w-3 h-3" />
                              {course.code}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 capitalize">
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {task.dueDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${
                          task.priority === "urgent"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : task.priority === "high"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Deadlines & Quick Jump */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Upcoming Deadlines</h2>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="p-6 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No upcoming deadlines in the next 7 days.
              </div>
            ) : (
              upcomingDeadlines.map((t: TaskItem) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                      {t.type.replace("_", " ")} • {t.priority} priority
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-indigo-400 shrink-0">
                    {formatDate(t.dueDate)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 mt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/tasks"
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 text-center transition"
              >
                Kanban & Tasks
              </Link>
              <Link
                href="/student/timetable"
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 text-center transition"
              >
                Timetable
              </Link>
              <Link
                href="/study-tools/flashcards"
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 text-center transition"
              >
                Flashcards
              </Link>
              <Link
                href="/developer/sprints"
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 text-center transition"
              >
                Sprint Burndown
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
