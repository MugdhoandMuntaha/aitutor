import { pgTable, text, timestamp, uuid, pgEnum, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { workspaces, teams } from "./workspaces";
import { users } from "./auth";

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
]);

export const sprintStatusEnum = pgEnum("sprint_status", [
  "planned",
  "active",
  "completed",
  "cancelled",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    key: text("key").notNull(), // e.g. "DF"
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").default("active").notNull(),
    color: text("color").default("#6366f1"),
    targetDate: timestamp("target_date", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("workspace_project_key_idx").on(table.workspaceId, table.key),
  ]
);

export const sprints = pgTable("sprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sprintNumber: integer("sprint_number").notNull(),
  goal: text("goal"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: sprintStatusEnum("status").default("planned").notNull(),
  totalStoryPoints: integer("total_story_points").default(0).notNull(),
  completedStoryPoints: integer("completed_story_points").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
