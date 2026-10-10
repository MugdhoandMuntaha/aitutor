"use client";

import { useState, useTransition } from "react";
import { X, Plus, Code2, GraduationCap, Sparkles } from "lucide-react";
import { createTask } from "../actions/task-actions";
import { LabelItem } from "../types";

interface ProjectOption {
  id: string;
  name: string;
  key: string;
}

interface CourseOption {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface TaskCreateDialogProps {
  workspaceProjects: ProjectOption[];
  workspaceCourses: CourseOption[];
  workspaceLabels: LabelItem[];
  onClose: () => void;
  onTaskCreated?: () => void;
  defaultStatus?: string;
}

export function TaskCreateDialog({
  workspaceProjects,
  workspaceCourses,
  workspaceLabels,
  onClose,
  onTaskCreated,
  defaultStatus = "todo",
}: TaskCreateDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [taskCategory, setTaskCategory] = useState<"developer" | "student" | "general">("developer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState<string>(workspaceProjects[0]?.id || "");
  const [courseId, setCourseId] = useState<string>(workspaceCourses[0]?.id || "");
  const [storyPoints, setStoryPoints] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [academicWeight, setAcademicWeight] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleCategorySwitch = (cat: "developer" | "student" | "general") => {
    setTaskCategory(cat);
    if (cat === "developer") {
      setType("feature");
    } else if (cat === "student") {
      setType("assignment");
    } else {
      setType("personal");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a task title");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status,
        priority,
        projectId: taskCategory === "developer" && projectId ? projectId : null,
        courseId: taskCategory === "student" && courseId ? courseId : null,
        storyPoints: storyPoints.trim() || null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        academicWeight: academicWeight.trim() || null,
        labelIds: selectedLabels,
      });

      if (res.error) {
        setError(res.error);
      } else {
        onTaskCreated?.();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-white">Create New Task</h3>
            <p className="text-xs text-slate-400">Add to your unified DevFlow workspace</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Category Pill Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => handleCategorySwitch("developer")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
                taskCategory === "developer"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Developer</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch("student")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
                taskCategory === "student"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleCategorySwitch("general")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
                taskCategory === "general"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                taskCategory === "developer"
                  ? "e.g. Implement WebSocket live cursor updates"
                  : taskCategory === "student"
                  ? "e.g. Write dynamic programming lab report"
                  : "e.g. Practice 30 mins LeetCode"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Type & Project/Course Linking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {taskCategory === "developer" && (
                  <>
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="chore">Chore</option>
                    <option value="refactor">Refactor</option>
                    <option value="code_review">Code Review</option>
                    <option value="pr">Pull Request</option>
                    <option value="deployment">Deployment</option>
                    <option value="tech_debt">Tech Debt</option>
                  </>
                )}
                {taskCategory === "student" && (
                  <>
                    <option value="assignment">Assignment</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Exam</option>
                    <option value="reading">Reading</option>
                    <option value="lecture_revision">Lecture Revision</option>
                    <option value="viva_prep">Viva Prep</option>
                  </>
                )}
                {taskCategory === "general" && (
                  <>
                    <option value="personal">Personal</option>
                    <option value="habit">Habit</option>
                    <option value="reminder">Reminder</option>
                  </>
                )}
              </select>
            </div>

            {taskCategory === "developer" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">No Project</option>
                  {workspaceProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.key}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {taskCategory === "student" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">No Course</option>
                  {workspaceCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {taskCategory === "general" && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  General Task
                </div>
              </div>
            )}
          </div>

          {/* Status, Priority & Due Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Estimates / Academic Weight */}
          <div className="grid grid-cols-2 gap-3">
            {taskCategory === "developer" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Story Points
                </label>
                <input
                  type="text"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  placeholder="e.g. 3.0"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Academic Weight (%)
                </label>
                <input
                  type="text"
                  value={academicWeight}
                  onChange={(e) => setAcademicWeight(e.target.value)}
                  placeholder="e.g. 15.00"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Est. Minutes
              </label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="60"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details, notes, links..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isPending ? "Creating..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
