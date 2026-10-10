"use client";

import { useState } from "react";
import { TaskWithRelations } from "../types";
import { formatDate } from "@/lib/utils";
import { ArrowUpDown, Code2, GraduationCap, Calendar } from "lucide-react";

interface TableViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
}

type SortField = "title" | "status" | "priority" | "type" | "dueDate" | "storyPoints";

export function TableView({ tasks, onTaskClick }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === "dueDate") {
      aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    } else if (sortField === "storyPoints") {
      aVal = a.storyPoints ? parseFloat(a.storyPoints) : 0;
      bVal = b.storyPoints ? parseFloat(b.storyPoints) : 0;
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort("title")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Title</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("type")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("priority")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold">Scope (Project/Course)</th>
              <th
                onClick={() => handleSort("storyPoints")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Points</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("dueDate")}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="hover:bg-slate-800/40 transition cursor-pointer group"
              >
                <td className="py-3 px-4 font-medium text-white group-hover:text-indigo-300">
                  {task.title}
                </td>
                <td className="py-3 px-4 text-slate-400 capitalize">
                  {task.type.replace("_", " ")}
                </td>
                <td className="py-3 px-4">
                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {task.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`uppercase font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                      task.priority === "urgent"
                        ? "bg-rose-500/15 text-rose-400"
                        : task.priority === "high"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {task.projectKey && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400">
                      <Code2 className="w-3 h-3" />
                      {task.projectKey}
                    </span>
                  )}
                  {task.courseCode && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400">
                      <GraduationCap className="w-3 h-3" />
                      {task.courseCode}
                    </span>
                  )}
                  {!task.projectKey && !task.courseCode && (
                    <span className="text-slate-500 text-[10px]">—</span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">
                  {task.storyPoints ? `${task.storyPoints} pts` : "—"}
                </td>
                <td className="py-3 px-4 text-slate-400">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
