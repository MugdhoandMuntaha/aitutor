"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, GraduationCap, Sparkles, Check, ArrowRight, Layers } from "lucide-react";
import { WORKSPACE_TEMPLATES } from "@/features/workspaces/templates";
import { createWorkspace } from "@/features/workspaces/actions/workspace-actions";

export default function OnboardingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"developer" | "student" | "both">("both");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("semester-setup");
  const [loading, setLoading] = useState(false);

  const filteredTemplates = WORKSPACE_TEMPLATES.filter(
    (t) => mode === "both" || t.category === "both" || t.category === mode
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createWorkspace({
        name: workspaceName,
        mode,
        templateId: selectedTemplate,
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500/30">
      <div className="max-w-3xl w-full space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to DevFlow
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Choose Your Operating Mode
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            DevFlow merges software engineering agile pipelines with computer science academic rigor into one unified cockpit.
          </p>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Developer Mode */}
          <button
            type="button"
            onClick={() => setMode("developer")}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              mode === "developer"
                ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Developer Mode</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Projects, 2-week agile sprints, story points, PRs, releases, and issue trackers.
            </p>
            {mode === "developer" && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>

          {/* Student Mode */}
          <button
            type="button"
            onClick={() => setMode("student")}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              mode === "student"
                ? "bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Student Mode</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Semesters, courses, lab reports, CGPA calculator, class schedules, and exam countdowns.
            </p>
            {mode === "student" && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>

          {/* Both (Hybrid) */}
          <button
            type="button"
            onClick={() => setMode("both")}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
              mode === "both"
                ? "bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-500/10"
                : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Dual Hybrid Mode</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Recommended for CS students building software. All tools unified in one view.
            </p>
            {mode === "both" && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        </div>

        {/* Workspace Details & Templates */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              placeholder="e.g. Alex's Engineering & CS Hub"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Starter Template (One-Click Setup)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-950/30 border-indigo-500/80"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{template.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {template.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{template.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Configuring workspace..." : "Launch DevFlow Workspace"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
