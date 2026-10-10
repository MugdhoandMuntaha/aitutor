"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskWithRelations, TaskStatus } from "../types";
import { TaskCard } from "../components/task-card";
import { Plus } from "lucide-react";
import { updateTaskStatus } from "../actions/task-actions";

interface KanbanViewProps {
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onAddTaskToStatus?: (status: TaskStatus) => void;
  onTaskUpdated?: () => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "text-slate-400 border-slate-700" },
  { id: "todo", label: "To Do", color: "text-indigo-400 border-indigo-500/30" },
  { id: "in_progress", label: "In Progress", color: "text-amber-400 border-amber-500/30" },
  { id: "in_review", label: "In Review", color: "text-purple-400 border-purple-500/30" },
  { id: "done", label: "Done", color: "text-emerald-400 border-emerald-500/30" },
];

function SortableTaskItem({
  task,
  onClick,
}: {
  task: TaskWithRelations;
  onClick: (t: TaskWithRelations) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

export function KanbanView({
  tasks,
  onTaskClick,
  onAddTaskToStatus,
  onTaskUpdated,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [taskList, setTaskList] = useState(tasks);

  // Sync state if prop changes
  if (tasks !== taskList && tasks.length !== taskList.length) {
    setTaskList(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped directly onto a column container
    const isColumnDrop = COLUMNS.some((c) => c.id === overId);
    let targetStatus: TaskStatus | null = null;

    if (isColumnDrop) {
      targetStatus = overId as TaskStatus;
    } else {
      // Dropped onto another task: take that task's status
      const overTask = taskList.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (targetStatus) {
      const movedTask = taskList.find((t) => t.id === activeId);
      if (movedTask && movedTask.status !== targetStatus) {
        // Optimistic UI update
        const updated = taskList.map((t) =>
          t.id === activeId ? { ...t, status: targetStatus! } : t
        );
        setTaskList(updated);

        // Server action mutation
        await updateTaskStatus(activeId, targetStatus);
        onTaskUpdated?.();
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[650px]">
        {COLUMNS.map((column) => {
          const colTasks = taskList.filter((t) => t.status === column.id);
          const totalPts = colTasks.reduce(
            (sum, t) => sum + (t.storyPoints ? parseFloat(t.storyPoints) : 0),
            0
          );

          return (
            <div
              key={column.id}
              className="w-80 shrink-0 flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-2xl max-h-[calc(100vh-230px)]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${column.color}`}>
                    {column.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {colTasks.length}
                  </span>
                  {totalPts > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {totalPts} pts
                    </span>
                  )}
                </div>

                {onAddTaskToStatus && (
                  <button
                    type="button"
                    onClick={() => onAddTaskToStatus(column.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title={`Add task to ${column.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Droppable Column Items */}
              <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[200px]">
                <SortableContext
                  id={column.id}
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colTasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onClick={onTaskClick}
                    />
                  ))}
                </SortableContext>

                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-slate-600 text-xs border border-dashed border-slate-800/80 rounded-xl">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-80 opacity-90 shadow-2xl">
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
