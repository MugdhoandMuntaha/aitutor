"use client";

import { signOut } from "next-auth/react";
import { ModeSwitch } from "../mode-switch";
import { UserAvatar } from "../user-avatar";
import { Search, Plus, Bell, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  workspace: {
    id: string;
    mode: "developer" | "student" | "both";
  };
}

export function Header({ user, workspace }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Mode Switcher */}
      <div className="flex items-center gap-4">
        <ModeSwitch workspaceId={workspace.id} currentMode={workspace.mode} />
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Quick search input */}
        <button
          type="button"
          onClick={() => {
            // Trigger Cmd+K palette event
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Quick search or NLP add...</span>
          <kbd className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Task */}
        <Link
          href="/tasks?new=true"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm shadow-indigo-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Task</span>
        </Link>

        {/* Notifications Icon */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-2 right-2 animate-pulse" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition cursor-pointer"
          >
            <UserAvatar name={user.name} image={user.image} size="sm" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
                <Link
                  href="/settings/workspace"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Workspace Settings
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
