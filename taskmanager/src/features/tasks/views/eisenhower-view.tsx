"use client";

import { TaskWithRelations } from "../types";
import { TaskCard } from "../components/task-card";
import { AlertCircle, Calendar, Zap, Inbox } from "lucide-react";

interface EisenhowerViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
}

export function EisenhowerView({ tasks, onTaskClick }: EisenhowerViewProps) {
  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const now = Date.now();

  // Quadrant 1: Urgent & Important (Urgent priority OR High + due in < 48 hours)
  const q1Tasks = activeTasks.filter((t) => {
    if (t.priority === "urgent") return true;
    if (t.priority === "high" && t.dueDate && new Date(t.dueDate).getTime() - now < 48 * 3600 * 1000) return true;
    return false;
  });

  // Quadrant 2: Important & Not Urgent (High/Medium priority with future/no deadline)
  const q2Tasks = activeTasks.filter((t) => {
    if (q1Tasks.includes(t)) return false;
    return t.priority === "high" || (t.priority === "medium" && t.storyPoints);
  });

  // Quadrant 3: Urgent & Less Important (Due within 48h but medium/low priority)
  const q3Tasks = activeTasks.filter((t) => {
    if (q1Tasks.includes(t) || q2Tasks.includes(t)) return false;
    if (t.dueDate && new Date(t.dueDate).getTime() - now < 72 * 3600 * 1000) return true;
    return false;
  });

  // Quadrant 4: Neither (Low priority, backlog, reminders)
  const q4Tasks = activeTasks.filter(
    (t) => !q1Tasks.includes(t) && !q2Tasks.includes(t) && !q3Tasks.includes(t)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Q1: Do First */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-rose-500/20 mb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              1. Do First (Urgent & Important)
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
            {q1Tasks.length}
          </span>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 max-h-[400px]">
          {q1Tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
          {q1Tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No urgent emergencies! Great job.
            </div>
          )}
        </div>
      </div>

      {/* Q2: Schedule */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Calendar className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              2. Schedule (Important, Not Urgent)
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
            {q2Tasks.length}
          </span>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 max-h-[400px]">
          {q2Tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
          {q2Tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              Plan out key goals and milestones.
            </div>
          )}
        </div>
      </div>

      {/* Q3: Delegate / Quick Sprints */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Zap className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              3. Quick Sprints (Urgent, Lower Impact)
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
            {q3Tasks.length}
          </span>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 max-h-[400px]">
          {q3Tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
          {q3Tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No low-impact urgent interruptions.
            </div>
          )}
        </div>
      </div>

      {/* Q4: Backlog & Drop */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Inbox className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              4. Backlog (Not Urgent & Low Impact)
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {q4Tasks.length}
          </span>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 max-h-[400px]">
          {q4Tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
          {q4Tasks.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No backlog debt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
