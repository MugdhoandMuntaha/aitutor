"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus, Building2 } from "lucide-react";
import { switchWorkspace } from "@/features/workspaces/actions/workspace-actions";

interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  mode: "developer" | "student" | "both";
  role: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspace: {
    id: string;
    name: string;
    mode: "developer" | "student" | "both";
    role: string;
  };
  workspaces: WorkspaceItem[];
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (id: string) => {
    if (id === currentWorkspace.id) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await switchWorkspace(id);
      setIsOpen(false);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentWorkspace.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{currentWorkspace.role}</p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Your Workspaces
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                disabled={switching}
                onClick={() => handleSelect(ws.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 transition text-left text-slate-200 cursor-pointer"
              >
                <div className="truncate">
                  <span className="font-medium text-white">{ws.name}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">({ws.mode})</span>
                </div>
                {ws.id === currentWorkspace.id && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
              </button>
            ))}
            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/onboarding");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
