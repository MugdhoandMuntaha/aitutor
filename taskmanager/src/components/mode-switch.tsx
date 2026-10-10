"use client";

import { useTransition } from "react";
import { Code2, GraduationCap, Sparkles } from "lucide-react";
import { updateWorkspaceMode } from "@/features/workspaces/actions/workspace-actions";

interface ModeSwitchProps {
  workspaceId: string;
  currentMode: "developer" | "student" | "both";
}

export function ModeSwitch({ workspaceId, currentMode }: ModeSwitchProps) {
  const [isPending, startTransition] = useTransition();

  const handleModeChange = (mode: "developer" | "student" | "both") => {
    if (mode === currentMode) return;
    startTransition(async () => {
      await updateWorkspaceMode(workspaceId, mode);
    });
  };

  return (
    <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner text-xs">
      {/* Developer Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleModeChange("developer")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
          currentMode === "developer"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Developer Mode (Projects, Sprints, Issues)"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Developer</span>
      </button>

      {/* Both / Dual Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleModeChange("both")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
          currentMode === "both"
            ? "bg-purple-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Dual Hybrid Mode (Developer + Student unified)"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Dual</span>
      </button>

      {/* Student Button */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleModeChange("student")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
          currentMode === "student"
            ? "bg-cyan-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Student Mode (Courses, Timetable, CGPA)"
      >
        <GraduationCap className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Student</span>
      </button>
    </div>
  );
}
