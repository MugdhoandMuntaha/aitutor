import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  numeric,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./auth";

export const habitFrequencyEnum = pgEnum("habit_frequency", ["daily", "weekly", "custom"]);
export const goalStatusEnum = pgEnum("goal_status", [
  "not_started",
  "in_progress",
  "achieved",
  "abandoned",
]);

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g., "LeetCode 2 Problems", "DSA revision"
  category: text("category").default("coding").notNull(), // "coding", "academics", "fitness", "reading"
  frequency: habitFrequencyEnum("frequency").default("daily").notNull(),
  targetDaysPerWeek: integer("target_days_per_week").default(7).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    loggedDate: date("logged_date").notNull(),
    value: integer("value").default(1).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("habit_date_unique").on(table.habitId, table.loggedDate),
  ]
);

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mode: text("mode").default("both").notNull(), // "developer", "student", "both"
  targetDate: timestamp("target_date", { withTimezone: true }),
  status: goalStatusEnum("status").default("in_progress").notNull(),
  progressPercentage: numeric("progress_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const keyResults = pgTable("key_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  initialValue: numeric("initial_value", { precision: 10, scale: 2 }).default("0").notNull(),
  currentValue: numeric("current_value", { precision: 10, scale: 2 }).default("0").notNull(),
  targetValue: numeric("target_value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").default("items").notNull(), // "problems", "stars", "%", "hours"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
