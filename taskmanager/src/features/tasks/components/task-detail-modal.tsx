"use client";

import { useState, useTransition } from "react";
import { TaskWithRelations, TaskStatus, TaskPriority, TaskType, LabelItem } from "../types";
import {
  X,
  Calendar,
  Clock,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  MessageSquare,
  GitPullRequest,
  GraduationCap,
  Code2,
  Save,
  Check,
  AlertTriangle,
  Tag,
  ExternalLink,
} from "lucide-react";
import {
  updateTask,
  deleteTask,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  addComment,
  attachLabel,
  removeLabel,
} from "../actions/task-actions";
import { formatDate } from "@/lib/utils";

interface TaskDetailModalProps {
  task: TaskWithRelations;
  workspaceLabels: LabelItem[];
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDetailModal({
  task,
  workspaceLabels,
  onClose,
  onTaskUpdated,
}: TaskDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [type, setType] = useState<TaskType>(task.type);
  const [storyPoints, setStoryPoints] = useState(task.storyPoints || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task.estimatedMinutes?.toString() || "");
  const [actualMinutes, setActualMinutes] = useState(task.actualMinutes?.toString() || "0");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [githubPrUrl, setGithubPrUrl] = useState(task.githubPrUrl || "");
  const [githubIssueUrl, setGithubIssueUrl] = useState(task.githubIssueUrl || "");
  const [academicWeight, setAcademicWeight] = useState(task.academicWeight || "");

  // Subtasks & Comments local state
  const [subtasksList, setSubtasksList] = useState(task.subtasks);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentsList, setCommentsList] = useState(task.comments || []);
  const [taskLabelsList, setTaskLabelsList] = useState(task.labels);

  const [conflictError, setConflictError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveChanges = () => {
    setConflictError("");
    setSaveSuccess(false);

    startTransition(async () => {
      const res = await updateTask({
        id: task.id,
        title,
        description,
        status,
        priority,
        type,
        storyPoints: storyPoints ? storyPoints : null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        actualMinutes: actualMinutes ? parseInt(actualMinutes, 10) : 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        githubPrUrl: githubPrUrl || null,
        githubIssueUrl: githubIssueUrl || null,
        academicWeight: academicWeight || null,
        expectedVersion: task.version,
      });

      if (res.conflict) {
        setConflictError(res.error || "Conflict detected.");
      } else if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onTaskUpdated?.();
      }
    });
  };

  const handleToggleSubtask = async (subId: string, currentStatus: boolean) => {
    const updated = subtasksList.map((s) =>
      s.id === subId ? { ...s, isCompleted: !currentStatus } : s
    );
    setSubtasksList(updated);
    await toggleSubtask(subId, !currentStatus);
    onTaskUpdated?.();
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const res = await createSubtask(task.id, newSubtaskTitle.trim());
    if (res.success && res.subtask) {
      setSubtasksList([...subtasksList, res.subtask]);
      setNewSubtaskTitle("");
      onTaskUpdated?.();
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    setSubtasksList(subtasksList.filter((s) => s.id !== subId));
    await deleteSubtask(subId);
    onTaskUpdated?.();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    const res = await addComment(task.id, commentContent.trim());
    if (res.success && res.comment) {
      setCommentsList([res.comment, ...commentsList]);
      setCommentContent("");
      onTaskUpdated?.();
    }
  };

  const handleDeleteTask = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id);
      onClose();
      onTaskUpdated?.();
    }
  };

  const handleToggleLabel = async (label: LabelItem) => {
    const exists = taskLabelsList.some((l) => l.id === label.id);
    if (exists) {
      setTaskLabelsList(taskLabelsList.filter((l) => l.id !== label.id));
      await removeLabel(task.id, label.id);
    } else {
      setTaskLabelsList([...taskLabelsList, label]);
      await attachLabel(task.id, label.id);
    }
    onTaskUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {task.projectKey && (
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <Code2 className="w-3.5 h-3.5" />
                {task.projectKey} • {task.projectName}
              </span>
            )}
            {task.courseCode && (
              <span
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border"
                style={{
                  backgroundColor: `${task.courseColor || "#06b6d4"}15`,
                  color: task.courseColor || "#06b6d4",
                  borderColor: `${task.courseColor || "#06b6d4"}30`,
                }}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                {task.courseCode} • {task.courseName}
              </span>
            )}
            <span className="text-xs text-slate-400 capitalize bg-slate-800 px-2 py-1 rounded-md">
              {type.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-sm shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? "Saved!" : isPending ? "Saving..." : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteTask}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {conflictError && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{conflictError}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left 2 Cols: Title, Markdown Description, Subtasks, Comments */}
          <div className="md:col-span-2 space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xl font-bold bg-transparent text-white border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none py-1 transition"
                placeholder="Task title..."
              />
            </div>

            {/* Description Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Description & Notes (Markdown)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 leading-relaxed font-sans"
                placeholder="Add rich description, acceptance criteria, or lecture notes..."
              />
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Checklist & Subtasks ({subtasksList.filter((s) => s.isCompleted).length}/
                  {subtasksList.length})
                </label>
              </div>

              <div className="space-y-2">
                {subtasksList.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 group hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(sub.id, sub.isCompleted)}
                      className="flex items-center gap-2.5 text-xs text-left cursor-pointer flex-1 min-w-0"
                    >
                      {sub.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          sub.isCompleted ? "line-through text-slate-500" : "text-white"
                        }`}
                      >
                        {sub.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask or checklist step..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Comments Feed */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion & Activity ({commentsList.length})</span>
              </label>

              {/* Post comment */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Leave a comment or mention @teammate..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Post
                </button>
              </form>

              {/* List comments */}
              <div className="space-y-2.5 pt-2">
                {commentsList.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="font-semibold text-slate-300">{c.userName || "User"}</span>
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-slate-200">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Metadata Properties Sidebar */}
          <div className="space-y-5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Task Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs capitalize focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <optgroup label="Developer Types">
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="chore">Chore</option>
                  <option value="refactor">Refactor</option>
                  <option value="code_review">Code Review</option>
                  <option value="pr">Pull Request</option>
                  <option value="deployment">Deployment</option>
                  <option value="tech_debt">Tech Debt</option>
                </optgroup>
                <optgroup label="Student Types">
                  <option value="assignment">Assignment</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="reading">Reading</option>
                  <option value="lecture_revision">Lecture Revision</option>
                  <option value="thesis_research">Thesis / Research</option>
                  <option value="viva_prep">Viva Prep</option>
                </optgroup>
                <optgroup label="General">
                  <option value="personal">Personal</option>
                  <option value="habit">Habit</option>
                  <option value="reminder">Reminder</option>
                </optgroup>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
              </input>
            </div>

            {/* Story Points & Estimates */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Story Points
                </label>
                <input
                  type="text"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Est. Minutes
                </label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="120"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Labels Palette */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {workspaceLabels.map((lbl) => {
                  const isAttached = taskLabelsList.some((l) => l.id === lbl.id);
                  return (
                    <button
                      type="button"
                      key={lbl.id}
                      onClick={() => handleToggleLabel(lbl)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                        isAttached ? "opacity-100 ring-1 ring-white/30" : "opacity-40 hover:opacity-80"
                      }`}
                      style={{
                        backgroundColor: `${lbl.color}25`,
                        color: lbl.color,
                        borderColor: `${lbl.color}50`,
                      }}
                    >
                      {lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Developer Integration Links */}
            {(task.projectId || type === "feature" || type === "bug" || type === "pr") && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  GitHub Links
                </label>
                <input
                  type="url"
                  value={githubPrUrl}
                  onChange={(e) => setGithubPrUrl(e.target.value)}
                  placeholder="https://github.com/org/repo/pull/42"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="url"
                  value={githubIssueUrl}
                  onChange={(e) => setGithubIssueUrl(e.target.value)}
                  placeholder="https://github.com/org/repo/issues/101"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Academic Metadata */}
            {(task.courseId || type === "assignment" || type === "exam" || type === "lab_report") && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Academic Weight (%)
                </label>
                <input
                  type="text"
                  value={academicWeight}
                  onChange={(e) => setAcademicWeight(e.target.value)}
                  placeholder="e.g. 15.00"
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
