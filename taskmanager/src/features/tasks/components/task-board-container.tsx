"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskWithRelations, ViewMode, LabelItem, TaskStatus } from "../types";
import { TaskFilterBar } from "./task-filter-bar";
import { KanbanView } from "../views/kanban-view";
import { ListView } from "../views/list-view";
import { CalendarView } from "../views/calendar-view";
import { TableView } from "../views/table-view";
import { EisenhowerView } from "../views/eisenhower-view";
import { TaskDetailModal } from "./task-detail-modal";
import { TaskCreateDialog } from "./task-create-dialog";
import { Plus } from "lucide-react";

interface TaskBoardContainerProps {
  initialTasks: TaskWithRelations[];
  workspaceProjects: Array<{ id: string; name: string; key: string }>;
  workspaceCourses: Array<{ id: string; name: string; code: string; color: string }>;
  workspaceLabels: LabelItem[];
  defaultView?: ViewMode;
  initialSelectedTaskId?: string;
}

export function TaskBoardContainer({
  initialTasks,
  workspaceProjects,
  workspaceCourses,
  workspaceLabels,
  defaultView = "kanban",
  initialSelectedTaskId,
}: TaskBoardContainerProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "developer" | "student">("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(
    initialTasks.find((t) => t.id === initialSelectedTaskId) || null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("todo");

  // Keep tasks synced if initialTasks updates
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Global Keyboard shortcut 'c' to create task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "c" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setCreateDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter tasks locally for rapid instant interaction
  const filteredTasks = tasks.filter((task) => {
    if (modeFilter === "developer" && !task.projectId && task.courseId) return false;
    if (modeFilter === "student" && !task.courseId && task.projectId) return false;

    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchProject = task.projectKey?.toLowerCase().includes(q);
      const matchCourse = task.courseCode?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchProject && !matchCourse) return false;
    }

    return true;
  });

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
  };

  const handleOpenCreateForStatus = (st: TaskStatus) => {
    setCreateDefaultStatus(st);
    setCreateDialogOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Unified Task Engine</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Dev & Academics
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Seamlessly toggle between Kanban, List, Calendar, Table, and Eisenhower views. Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
              C
            </kbd>{" "}
            to quick add.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateDefaultStatus("todo");
            setCreateDialogOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and View Bar */}
      <TaskFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        modeFilter={modeFilter}
        onModeFilterChange={setModeFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={filteredTasks.length}
      />

      {/* Main View Area */}
      <div className="min-h-[500px]">
        {viewMode === "kanban" && (
          <KanbanView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onAddTaskToStatus={handleOpenCreateForStatus}
            onTaskUpdated={handleRefresh}
          />
        )}
        {viewMode === "list" && (
          <ListView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskUpdated={handleRefresh}
          />
        )}
        {viewMode === "calendar" && (
          <CalendarView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
          />
        )}
        {viewMode === "table" && (
          <TableView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
          />
        )}
        {viewMode === "matrix" && (
          <EisenhowerView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspaceLabels={workspaceLabels}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleRefresh}
        />
      )}

      {/* Task Create Dialog */}
      {createDialogOpen && (
        <TaskCreateDialog
          workspaceProjects={workspaceProjects}
          workspaceCourses={workspaceCourses}
          workspaceLabels={workspaceLabels}
          defaultStatus={createDefaultStatus}
          onClose={() => setCreateDialogOpen(false)}
          onTaskCreated={handleRefresh}
        />
      )}
    </div>
  );
}
