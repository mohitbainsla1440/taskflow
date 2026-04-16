import { useState, type DragEvent } from "react";
import { TaskCard } from "./TaskCard";
import type { Task, TaskStatus } from "../lib/api";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  draggingTaskId: number | null;
  onDragStartTask: (task: Task) => void;
  onDragEndTask: () => void;
  onDropTask: (status: TaskStatus) => void;
  onDeleteTask: (taskId: number) => void;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  draggingTaskId,
  onDragStartTask,
  onDragEndTask,
  onDropTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isOver) setIsOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsOver(false);
    onDropTask(status);
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[24rem] w-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 transition ${
        isOver ? "drag-over" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
            Drop tasks here
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onDragStartTask}
              onDragEnd={onDragEndTask}
              onDelete={onDeleteTask}
              isDragging={draggingTaskId === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
