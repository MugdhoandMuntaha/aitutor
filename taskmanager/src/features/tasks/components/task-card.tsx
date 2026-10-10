"use client";

import { TaskWithRelations } from "../types";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  GitPullRequest,
  Bug,
  Code2,
  GraduationCap,
  Sparkles,
  Layers,
  Clock,
  CheckSquare,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithRelations;
  onClick: (task: TaskWithRelations) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now() &&
    task.status !== "done";

  const completedSubtasks = task.subtasks.filter((s) => s.isCompleted).length;
  const totalSubtasks = task.subtasks.length;

  const getTypeIcon = () => {
    switch (task.type) {
      case "bug":
        return <Bug className="w-3 h-3 text-rose-400" />;
      case "feature":
        return <Code2 className="w-3 h-3 text-indigo-400" />;
      case "pr":
      case "code_review":
        return <GitPullRequest className="w-3 h-3 text-purple-400" />;
      case "assignment":
      case "lab_report":
      case "exam":
      case "quiz":
      case "viva_prep":
        return <GraduationCap className="w-3 h-3 text-cyan-400" />;
      default:
        return <Sparkles className="w-3 h-3 text-slate-400" />;
    }
  };

  const getPriorityBadge = () => {
    switch (task.priority) {
      case "urgent":
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            High
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
            Med
          </span>
        );
      case "low":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={`group relative p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-indigo-950/20 ${
        isDragging ? "opacity-50 scale-95 border-indigo-500 shadow-2xl" : ""
      }`}
    >
      {/* Top Header: Course / Project Pill & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Developer Project Pill */}
          {task.projectKey && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Code2 className="w-3 h-3" />
              {task.projectKey}
            </span>
          )}

          {/* Student Course Pill */}
          {task.courseCode && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${task.courseColor || "#06b6d4"}15`,
                color: task.courseColor || "#06b6d4",
                borderColor: `${task.courseColor || "#06b6d4"}30`,
              }}
            >
              <GraduationCap className="w-3 h-3" />
              {task.courseCode}
            </span>
          )}

          {/* Task Type */}
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 capitalize bg-slate-800/60 px-1.5 py-0.5 rounded">
            {getTypeIcon()}
            <span>{task.type.replace("_", " ")}</span>
          </span>
        </div>

        {getPriorityBadge()}
      </div>

      {/* Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-normal">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex items-center gap-1 mt-2.5 flex-wrap">
          {task.labels.map((lbl) => (
            <span
              key={lbl.id}
              className="text-[9px] px-1.5 py-0.2 rounded font-medium"
              style={{
                backgroundColor: `${lbl.color}20`,
                color: lbl.color,
                border: `1px solid ${lbl.color}35`,
              }}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer Info: Subtasks, Story Points, Due Date */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2.5">
          {totalSubtasks > 0 && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium ${
                completedSubtasks === totalSubtasks
                  ? "text-emerald-400"
                  : "text-slate-400"
              }`}
              title={`${completedSubtasks} of ${totalSubtasks} subtasks completed`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </span>
          )}

          {task.storyPoints && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {task.storyPoints} pts
            </span>
          )}

          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" />
              {task.estimatedMinutes}m
            </span>
          )}
        </div>

        {task.dueDate && (
          <span
            className={`flex items-center gap-1 text-[10px] font-medium ${
              isOverdue
                ? "text-rose-400 font-semibold"
                : "text-slate-400"
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <Calendar className="w-3 h-3 text-slate-500" />
            )}
            <span>{formatDate(task.dueDate)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
