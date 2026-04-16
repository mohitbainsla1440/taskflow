import type { DragEvent } from "react";
import type { Task } from "../lib/api";

interface TaskCardProps {
  task: Task;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDelete: (taskId: number) => void;
  isDragging: boolean;
}

export function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  onDelete,
  isDragging,
}: TaskCardProps) {
  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(task.id));
    onDragStart(task);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md active:cursor-grabbing ${
        isDragging ? "dragging" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          aria-label={`Delete task ${task.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1a.75.75 0 0 0-.75.75V3H4.75a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H12V1.75a.75.75 0 0 0-.75-.75h-2.5ZM5.5 6h9l-.6 10.2A2 2 0 0 1 11.9 18H8.1a2 2 0 0 1-2-1.8L5.5 6Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {task.description && (
        <p className="mt-2 text-xs text-slate-600">{task.description}</p>
      )}
    </div>
  );
}
