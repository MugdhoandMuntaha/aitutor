import { pgTable, text, timestamp, uuid, pgEnum, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const semesterSeasonEnum = pgEnum("semester_season", ["spring", "summer", "fall", "winter"]);
export const courseDayEnum = pgEnum("course_day", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const syllabusStatusEnum = pgEnum("syllabus_status", ["pending", "studying", "mastered"]);

export const semesters = pgTable("semesters", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Fall 2026"
  season: semesterSeasonEnum("season").notNull(),
  year: integer("year").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  semesterId: uuid("semester_id").references(() => semesters.id, { onDelete: "set null" }),
  code: text("code").notNull(), // e.g. "CSE 301"
  name: text("name").notNull(), // e.g. "Operating Systems"
  credits: numeric("credits", { precision: 3, scale: 1 }).default("3.0").notNull(),
  instructorName: text("instructor_name"),
  instructorEmail: text("instructor_email"),
  syllabusUrl: text("syllabus_url"),
  color: text("color").default("#06b6d4").notNull(),
  targetGrade: text("target_grade").default("A"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const classSchedules = pgTable("class_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  dayOfWeek: courseDayEnum("day_of_week").notNull(),
  startTime: text("start_time").notNull(), // e.g. "10:00"
  endTime: text("end_time").notNull(),     // e.g. "11:30"
  location: text("location"),              // e.g. "Room 402 / Zoom"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const syllabusTopics = pgTable("syllabus_topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").default(0).notNull(),
  status: syllabusStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  taskId: uuid("task_id"), // linked unified task (added as FK after task schema)
  title: text("title").notNull(),
  weightPercentage: numeric("weight_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100").notNull(),
  earnedScore: numeric("earned_score", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isGroupProject: boolean("is_group_project").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  taskId: uuid("task_id"), // linked unified task
  name: text("name").notNull(), // "Midterm", "Final Exam", "Quiz 1"
  weightPercentage: numeric("weight_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
  examDate: timestamp("exam_date", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").default(120).notNull(),
  roomLocation: text("room_location"),
  maxScore: numeric("max_score", { precision: 5, scale: 2 }).default("100").notNull(),
  earnedScore: numeric("earned_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const grades = pgTable("grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  finalGradeLetter: text("final_grade_letter"), // "A+", "A", "B", etc.
  finalGradePoint: numeric("final_grade_point", { precision: 4, scale: 2 }), // 4.0, 3.7
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
