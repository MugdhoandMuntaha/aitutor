"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  FileText,
  Flame,
  Target,
  BarChart3,
  FolderGit2,
  GitPullRequest,
  ListFilter,
  Tag,
  BookOpen,
  Calendar,
  GraduationCap,
  Brain,
  Sparkles,
  Settings,
  Code2,
} from "lucide-react";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface SidebarProps {
  currentWorkspace: {
    id: string;
    name: string;
    mode: "developer" | "student" | "both";
    role: string;
  };
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    mode: "developer" | "student" | "both";
    role: string;
  }>;
}

export function Sidebar({ currentWorkspace, workspaces }: SidebarProps) {
  const pathname = usePathname();
  const mode = currentWorkspace.mode;

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
      active
        ? "bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20 shadow-sm"
        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
    }`;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/90 backdrop-blur-xl flex flex-col shrink-0 select-none h-screen sticky top-0">
      {/* Brand & Workspace Switcher */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <Link href="/" className="flex items-center gap-2.5 px-1 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">DevFlow</span>
            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
              v1.0
            </span>
          </div>
        </Link>

        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
        />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Unified Workspace */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Unified Workspace
          </div>
          <Link href="/" className={navItemClass(isActive("/"))}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/tasks" className={navItemClass(isActive("/tasks"))}>
            <CheckSquare className="w-4 h-4" />
            <span>All Tasks & Views</span>
          </Link>
          <Link href="/time-tracking" className={navItemClass(isActive("/time-tracking"))}>
            <Clock className="w-4 h-4" />
            <span>Time Tracking</span>
          </Link>
          <Link href="/notes" className={navItemClass(isActive("/notes"))}>
            <FileText className="w-4 h-4" />
            <span>Notes & Docs</span>
          </Link>
          <Link href="/habits" className={navItemClass(isActive("/habits"))}>
            <Flame className="w-4 h-4" />
            <span>Habits & Streaks</span>
          </Link>
          <Link href="/goals" className={navItemClass(isActive("/goals"))}>
            <Target className="w-4 h-4" />
            <span>Goals / OKRs</span>
          </Link>
          <Link href="/analytics" className={navItemClass(isActive("/analytics"))}>
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Link>
        </div>

        {/* Developer Module */}
        {(mode === "developer" || mode === "both") && (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold text-indigo-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Developer</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400">Agile</span>
            </div>
            <Link href="/developer/projects" className={navItemClass(isActive("/developer/projects"))}>
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Projects</span>
            </Link>
            <Link href="/developer/sprints" className={navItemClass(isActive("/developer/sprints"))}>
              <GitPullRequest className="w-4 h-4 text-indigo-400" />
              <span>Sprints & Burndown</span>
            </Link>
            <Link href="/developer/backlog" className={navItemClass(isActive("/developer/backlog"))}>
              <ListFilter className="w-4 h-4 text-indigo-400" />
              <span>Product Backlog</span>
            </Link>
            <Link href="/developer/releases" className={navItemClass(isActive("/developer/releases"))}>
              <Tag className="w-4 h-4 text-indigo-400" />
              <span>Releases & Changelog</span>
            </Link>
          </div>
        )}

        {/* Student Module */}
        {(mode === "student" || mode === "both") && (
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-semibold text-cyan-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Student</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400">CSE</span>
            </div>
            <Link href="/student/courses" className={navItemClass(isActive("/student/courses"))}>
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Courses & Syllabus</span>
            </Link>
            <Link href="/student/timetable" className={navItemClass(isActive("/student/timetable"))}>
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Class Timetable</span>
            </Link>
            <Link href="/student/grades" className={navItemClass(isActive("/student/grades"))}>
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Grades & CGPA</span>
            </Link>
            <Link href="/student/exam-prep" className={navItemClass(isActive("/student/exam-prep"))}>
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Exam Prep & Countdowns</span>
            </Link>
            <Link href="/study-tools/flashcards" className={navItemClass(isActive("/study-tools/flashcards"))}>
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>SM-2 Flashcards</span>
            </Link>
          </div>
        )}
      </div>

      {/* Settings footer */}
      <div className="p-3 border-t border-slate-800/80">
        <Link
          href="/settings/workspace"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition"
        >
          <Settings className="w-4 h-4" />
          <span>Workspace Settings</span>
        </Link>
      </div>
    </aside>
  );
}
