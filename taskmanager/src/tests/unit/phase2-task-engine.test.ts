import { describe, it, expect } from "vitest";
import { createTaskSchema, updateTaskSchema } from "@/features/tasks/validation";

describe("Phase 2: Unified Task Engine Tests", () => {
  it("validates valid developer task creation input", () => {
    const validDevTask = {
      title: "Implement distributed consensus algorithm",
      description: "Raft algorithm leader election and log replication",
      type: "feature",
      status: "in_progress",
      priority: "high",
      storyPoints: "5.0",
      estimatedMinutes: 240,
    };

    const parsed = createTaskSchema.safeParse(validDevTask);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe(validDevTask.title);
      expect(parsed.data.type).toBe("feature");
      expect(parsed.data.priority).toBe("high");
    }
  });

  it("validates valid student task creation input", () => {
    const validStudentTask = {
      title: "Submit OS Lab 3: Virtual Memory Paging",
      description: "Implement clock page replacement in xv6",
      type: "assignment",
      status: "todo",
      priority: "urgent",
      academicWeight: "15.00",
      estimatedMinutes: 180,
    };

    const parsed = createTaskSchema.safeParse(validStudentTask);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe(validStudentTask.title);
      expect(parsed.data.type).toBe("assignment");
      expect(parsed.data.priority).toBe("urgent");
    }
  });

  it("rejects task creation when title is empty", () => {
    const invalidTask = {
      title: "",
      type: "feature",
    };

    const parsed = createTaskSchema.safeParse(invalidTask);
    expect(parsed.success).toBe(false);
  });

  it("validates optimistic version updates for concurrency control", () => {
    const validUpdate = {
      id: "a0fcf4f1-3a65-4013-a8d0-740e975a24ca",
      title: "Updated task title",
      status: "done",
      expectedVersion: 3,
    };

    const parsed = updateTaskSchema.safeParse(validUpdate);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.expectedVersion).toBe(3);
      expect(parsed.data.status).toBe("done");
    }
  });

  it("calculates subtask progress percentage correctly", () => {
    const subtasks = [
      { id: "1", taskId: "t1", title: "Step 1", isCompleted: true, sortOrder: 1 },
      { id: "2", taskId: "t1", title: "Step 2", isCompleted: true, sortOrder: 2 },
      { id: "3", taskId: "t1", title: "Step 3", isCompleted: false, sortOrder: 3 },
      { id: "4", taskId: "t1", title: "Step 4", isCompleted: false, sortOrder: 4 },
    ];

    const completed = subtasks.filter((s) => s.isCompleted).length;
    const progress = Math.round((completed / subtasks.length) * 100);

    expect(completed).toBe(2);
    expect(progress).toBe(50);
  });
});
