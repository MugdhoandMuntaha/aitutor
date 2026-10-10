export type TaskType =
  | "feature"
  | "bug"
  | "chore"
  | "refactor"
  | "code_review"
  | "pr"
  | "deployment"
  | "research_spike"
  | "tech_debt"
  | "meeting"
  | "assignment"
  | "lab_report"
  | "quiz"
  | "exam"
  | "project_milestone"
  | "reading"
  | "lecture_revision"
  | "thesis_research"
  | "presentation"
  | "viva_prep"
  | "personal"
  | "habit"
  | "reminder";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "done"
  | "cancelled";

export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

export interface SubtaskItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  dueDate?: Date | null;
}

export interface LabelItem {
  id: string;
  name: string;
  color: string;
  description?: string | null;
}

export interface CommentItem {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  userName?: string | null;
  userImage?: string | null;
}

export interface TaskWithRelations {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  projectName?: string | null;
  projectKey?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  courseId?: string | null;
  courseCode?: string | null;
  courseName?: string | null;
  courseColor?: string | null;
  parentId?: string | null;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes: number;
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  githubIssueUrl?: string | null;
  githubPrUrl?: string | null;
  branchName?: string | null;
  academicWeight?: string | null;
  rubricUrl?: string | null;
  sortOrder: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  subtasks: SubtaskItem[];
  labels: LabelItem[];
  comments?: CommentItem[];
}

export type ViewMode = "kanban" | "list" | "calendar" | "table" | "matrix";
