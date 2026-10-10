"use client";

import { ViewMode } from "../types";
import {
  Kanban,
  List,
  Calendar,
  Table as TableIcon,
  LayoutGrid,
  Search,
  Code2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface TaskFilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  modeFilter: "all" | "developer" | "student";
  onModeFilterChange: (mode: "all" | "developer" | "student") => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  totalCount: number;
}

export function TaskFilterBar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  modeFilter,
  onModeFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
}: TaskFilterBarProps) {
  const views: { id: ViewMode; label: string; icon: any }[] = [
    { id: "kanban", label: "Kanban", icon: Kanban },
    { id: "list", label: "List", icon: List },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "matrix", label: "Eisenhower", icon: LayoutGrid },
    { id: "table", label: "Table", icon: TableIcon },
  ];

  return (
    <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
      {/* Top Row: View Switcher & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800/80 overflow-x-auto">
          {views.map((v) => {
            const Icon = v.icon;
            const isSelected = viewMode === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewModeChange(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, descriptions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Bottom Row: Scope / Mode Pill & Select Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
        {/* Scope Pill */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Filter Scope:
          </span>
          <button
            type="button"
            onClick={() => onModeFilterChange("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
              modeFilter === "all"
                ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Modes
          </button>
          <button
            type="button"
            onClick={() => onModeFilterChange("developer")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
              modeFilter === "developer"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>Developer</span>
          </button>
          <button
            type="button"
            onClick={() => onModeFilterChange("student")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
              modeFilter === "student"
                ? "bg-cyan-600/20 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3 h-3" />
            <span>Student</span>
          </button>
        </div>

        {/* Priority & Status Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
            <option value="backlog">Backlog</option>
          </select>

          <span className="text-[11px] text-slate-500 ml-1 font-mono">
            {totalCount} task{totalCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
