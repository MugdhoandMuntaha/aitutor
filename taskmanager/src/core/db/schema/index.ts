import { relations } from "drizzle-orm";

export * from "./auth";
export * from "./workspaces";
export * from "./developer";
export * from "./student";
export * from "./tasks";
export * from "./study";
export * from "./notes";
export * from "./habits-goals";
export * from "./system";

import { users } from "./auth";
import { workspaces, workspaceMembers, teams, teamMembers } from "./workspaces";
import { projects, sprints } from "./developer";
import { semesters, courses, classSchedules, syllabusTopics, assignments, exams, grades } from "./student";
import {
  tasks,
  taskAssignees,
  taskDependencies,
  subtasks,
  labels,
  taskLabels,
  comments,
  attachments,
  recurringRules,
  savedFilters,
} from "./tasks";
import { studySessions, flashcardDecks, flashcards, timeEntries } from "./study";
import { notes, noteLinks } from "./notes";
import { habits, habitLogs, goals, keyResults } from "./habits-goals";
import { notifications, activityLogs } from "./system";

// ==========================================
// DRIZZLE RELATIONS DEFINITIONS
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
  assignedTasks: many(taskAssignees),
  comments: many(comments),
  timeEntries: many(timeEntries),
  habits: many(habits),
  goals: many(goals),
  notifications: many(notifications),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  teams: many(teams),
  projects: many(projects),
  courses: many(courses),
  semesters: many(semesters),
  tasks: many(tasks),
  notes: many(notes),
  habits: many(habits),
  goals: many(goals),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  sprints: many(sprints),
  tasks: many(tasks),
}));

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
  project: one(projects, {
    fields: [sprints.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [courses.workspaceId],
    references: [workspaces.id],
  }),
  semester: one(semesters, {
    fields: [courses.semesterId],
    references: [semesters.id],
  }),
  schedules: many(classSchedules),
  syllabusTopics: many(syllabusTopics),
  assignments: many(assignments),
  exams: many(exams),
  tasks: many(tasks),
  flashcardDecks: many(flashcardDecks),
  notes: many(notes),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  sprint: one(sprints, {
    fields: [tasks.sprintId],
    references: [sprints.id],
  }),
  course: one(courses, {
    fields: [tasks.courseId],
    references: [courses.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "nested_subtasks",
  }),
  childTasks: many(tasks, {
    relationName: "nested_subtasks",
  }),
  assignees: many(taskAssignees),
  subtasks: many(subtasks),
  labels: many(taskLabels),
  comments: many(comments),
  attachments: many(attachments),
  timeEntries: many(timeEntries),
  dependenciesBlocked: many(taskDependencies, { relationName: "blocker" }),
  dependenciesBlocking: many(taskDependencies, { relationName: "blocked" }),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignees.userId],
    references: [users.id],
  }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const flashcardDecksRelations = relations(flashcardDecks, ({ one, many }) => ({
  course: one(courses, {
    fields: [flashcardDecks.courseId],
    references: [courses.id],
  }),
  flashcards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  deck: one(flashcardDecks, {
    fields: [flashcards.deckId],
    references: [flashcardDecks.id],
  }),
}));

export const habitsRelations = relations(habits, ({ many }) => ({
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  keyResults: many(keyResults),
}));

export const keyResultsRelations = relations(keyResults, ({ one }) => ({
  goal: one(goals, {
    fields: [keyResults.goalId],
    references: [goals.id],
  }),
}));
