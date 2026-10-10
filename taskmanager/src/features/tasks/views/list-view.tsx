"use client";

import { TaskWithRelations } from "../types";
import {
  CheckSquare,
  Square,
  Calendar,
  Code2,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { updateTaskStatus } from "../actions/task-actions";

interface ListViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onTaskUpdated?: () => void;
}

export function ListView({ tasks, onTaskClick, onTaskUpdated }: ListViewProps) {
  const handleToggleComplete = async (e: React.MouseEvent, task: TaskWithRelations) => {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
    onTaskUpdated?.();
  };

  const statusGroups = [
    { title: "In Progress & Active", items: tasks.filter((t) => t.status === "in_progress" || t.status === "in_review") },
    { title: "To Do & Backlog", items: tasks.filter((t) => t.status === "todo" || t.status === "backlog") },
    { title: "Completed", items: tasks.filter((t) => t.status === "done") },
  ];

  return (
    <div className="space-y-6">
      {statusGroups.map((group) => {
        if (group.items.length === 0) return null;

        return (
          <div key={group.title} className="space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {group.title} ({group.items.length})
              </h3>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
              {group.items.map((task) => {
                const isDone = task.status === "done";
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate).getTime() < Date.now() &&
                  !isDone;

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="p-3.5 hover:bg-slate-800/50 transition flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Quick Complete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleComplete(e, task)}
                        className="text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isDone ? "line-through text-slate-500" : "text-white group-hover:text-indigo-300"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {task.projectKey && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-medium">
                              <Code2 className="w-3 h-3" />
                              {task.projectKey}
                            </span>
                          )}
                          {task.courseCode && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-medium">
                              <GraduationCap className="w-3 h-3" />
                              {task.courseCode}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 capitalize">
                            {task.type.replace("_", " ")}
                          </span>
                          {task.subtasks.length > 0 && (
                            <span className="text-[10px] text-slate-500">
                              • {task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Meta */}
                    <div className="flex items-center gap-3 shrink-0">
                      {task.dueDate && (
                        <span
                          className={`text-xs flex items-center gap-1 ${
                            isOverdue ? "text-rose-400 font-medium" : "text-slate-400"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          task.priority === "urgent"
                            ? "bg-rose-500/15 text-rose-400"
                            : task.priority === "high"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {task.priority}
                      </span>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
