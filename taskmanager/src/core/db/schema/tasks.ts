import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  numeric,
  boolean,
  doublePrecision,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./auth";
import { projects, sprints } from "./developer";
import { courses } from "./student";

export const taskTypeEnum = pgEnum("task_type", [
  // Developer types
  "feature",
  "bug",
  "chore",
  "refactor",
  "code_review",
  "pr",
  "deployment",
  "research_spike",
  "tech_debt",
  "meeting",
  // Student types
  "assignment",
  "lab_report",
  "quiz",
  "exam",
  "project_milestone",
  "reading",
  "lecture_revision",
  "thesis_research",
  "presentation",
  "viva_prep",
  // General types
  "personal",
  "habit",
  "reminder",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
]);

export const dependencyTypeEnum = pgEnum("dependency_type", [
  "blocks",
  "blocked_by",
  "relates_to",
]);

export const recurringRules = pgTable("recurring_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  frequency: text("frequency").notNull(), // "daily", "weekly", "monthly", "custom"
  interval: integer("interval").default(1).notNull(),
  byDays: jsonb("by_days"), // array of weekdays e.g. ["mon", "wed"]
  endDate: timestamp("end_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  
  // Scoping links (Developer or Student or General)
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  sprintId: uuid("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  parentId: uuid("parent_id"), // self-reference for subtasks / nested hierarchy

  // Core properties
  title: text("title").notNull(),
  description: text("description"),
  type: taskTypeEnum("type").default("feature").notNull(),
  status: taskStatusEnum("status").default("todo").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),

  // Estimates & Time
  storyPoints: numeric("story_points", { precision: 4, scale: 1 }),
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes").default(0).notNull(),

  // Dates
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),

  // Developer mode specific metadata
  githubIssueUrl: text("github_issue_url"),
  githubPrUrl: text("github_pr_url"),
  branchName: text("branch_name"),

  // Student mode specific metadata
  academicWeight: numeric("academic_weight", { precision: 5, scale: 2 }),
  rubricUrl: text("rubric_url"),

  // Recurrence & Ordering
  recurringRuleId: uuid("recurring_rule_id").references(() => recurringRules.id, { onDelete: "set null" }),
  sortOrder: doublePrecision("sort_order").default(0).notNull(),

  // Optimistic Concurrency Control
  version: integer("version").default(1).notNull(),

  // Audit
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const taskAssignees = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
  ]
);

export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  blockerTaskId: uuid("blocker_task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  blockedTaskId: uuid("blocked_task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  type: dependencyTypeEnum("type").default("blocks").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subtasks = pgTable("subtasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const labels = pgTable("labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6366f1").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
  ]
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  mimeType: text("mime_type"),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  viewMode: text("view_mode").default("list").notNull(), // "list", "kanban", "calendar", "table", "matrix"
  filterJson: jsonb("filter_json").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
