"use client";

import { useState } from "react";
import { TaskWithRelations } from "../types";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Code2, GraduationCap } from "lucide-react";

interface CalendarViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // First day of month & total days
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Map tasks by day
  const tasksByDay = new Map<number, TaskWithRelations[]>();
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      const list = tasksByDay.get(day) || [];
      list.push(t);
      tasksByDay.set(day, list);
    }
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden p-6 space-y-6">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {monthName} {year}
            </h2>
            <p className="text-xs text-slate-400">Deadlines and deliverables timeline</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-400 py-2 border-b border-slate-800"
          >
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[100px] p-2 bg-slate-950/20 rounded-xl" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const isToday = isCurrentMonth && today.getDate() === dayNum;
          const dayTasks = tasksByDay.get(dayNum) || [];

          return (
            <div
              key={`day-${dayNum}`}
              className={`min-h-[110px] p-2.5 rounded-xl border transition flex flex-col justify-between ${
                isToday
                  ? "bg-indigo-950/20 border-indigo-500/50 shadow-inner"
                  : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                      : "text-slate-400"
                  }`}
                >
                  {dayNum}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Task badges list */}
              <div className="space-y-1 mt-1.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="p-1 px-1.5 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer text-[10px] text-white truncate transition flex items-center gap-1"
                  >
                    {task.projectKey && <Code2 className="w-2.5 h-2.5 text-indigo-400 shrink-0" />}
                    {task.courseCode && <GraduationCap className="w-2.5 h-2.5 text-cyan-400 shrink-0" />}
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-slate-500 font-medium px-1">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
