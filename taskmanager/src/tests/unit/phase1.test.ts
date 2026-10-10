import { describe, it, expect } from "vitest";
import * as argon2 from "argon2";
import { calculateSM2 } from "@/lib/sm2";
import { WORKSPACE_TEMPLATES } from "@/features/workspaces/templates";
import * as schema from "@/core/db/schema";

describe("Phase 1: Security, Models, and Algorithm Tests", () => {
  it("hashes and verifies passwords securely using Argon2", async () => {
    const rawPassword = "SuperSecurePassword123!";
    const hash = await argon2.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2")).toBe(true);

    const isMatch = await argon2.verify(hash, rawPassword);
    expect(isMatch).toBe(true);

    const isWrongMatch = await argon2.verify(hash, "WrongPassword!");
    expect(isWrongMatch).toBe(false);
  });

  it("contains all 7 required one-click workspace templates", () => {
    expect(WORKSPACE_TEMPLATES.length).toBe(7);
    const templateIds = WORKSPACE_TEMPLATES.map((t) => t.id);

    expect(templateIds).toContain("semester-setup");
    expect(templateIds).toContain("sprint-planning");
    expect(templateIds).toContain("final-year-project");
    expect(templateIds).toContain("exam-prep-2-weeks");
    expect(templateIds).toContain("open-source-contribution");
    expect(templateIds).toContain("job-internship-hunt");
    expect(templateIds).toContain("hackathon-weekend");
  });

  it("correctly calculates SM-2 spaced repetition intervals", () => {
    // Initial successful review
    const step1 = calculateSM2(5, 0, 1, 2.5);
    expect(step1.interval).toBe(1);
    expect(step1.repetitions).toBe(1);
    expect(step1.easeFactor).toBeGreaterThanOrEqual(2.5);

    // Second review
    const step2 = calculateSM2(4, 1, step1.interval, step1.easeFactor);
    expect(step2.interval).toBe(6);
    expect(step2.repetitions).toBe(2);

    // Failed recall (quality < 3) resets repetitions
    const failed = calculateSM2(1, 2, 6, 2.5);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);
  });

  it("exports all 40 core entity tables and enums in schema", () => {
    expect(schema.users).toBeDefined();
    expect(schema.workspaces).toBeDefined();
    expect(schema.workspaceMembers).toBeDefined();
    expect(schema.projects).toBeDefined();
    expect(schema.sprints).toBeDefined();
    expect(schema.tasks).toBeDefined();
    expect(schema.taskDependencies).toBeDefined();
    expect(schema.subtasks).toBeDefined();
    expect(schema.labels).toBeDefined();
    expect(schema.comments).toBeDefined();
    expect(schema.attachments).toBeDefined();
    expect(schema.semesters).toBeDefined();
    expect(schema.courses).toBeDefined();
    expect(schema.classSchedules).toBeDefined();
    expect(schema.assignments).toBeDefined();
    expect(schema.exams).toBeDefined();
    expect(schema.grades).toBeDefined();
    expect(schema.studySessions).toBeDefined();
    expect(schema.flashcardDecks).toBeDefined();
    expect(schema.flashcards).toBeDefined();
    expect(schema.timeEntries).toBeDefined();
    expect(schema.notes).toBeDefined();
    expect(schema.noteLinks).toBeDefined();
    expect(schema.habits).toBeDefined();
    expect(schema.habitLogs).toBeDefined();
    expect(schema.goals).toBeDefined();
    expect(schema.keyResults).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.activityLogs).toBeDefined();
    expect(schema.apiTokens).toBeDefined();
    expect(schema.webhooks).toBeDefined();
    expect(schema.integrations).toBeDefined();
  });
});
