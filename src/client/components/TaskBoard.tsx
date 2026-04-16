import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  moveTask,
  type Task,
  type TaskStatus,
} from "../lib/api";
import type { UseAuthReturn } from "../hooks/useAuth";
import { KanbanColumn } from "./KanbanColumn";

interface TaskBoardProps {
  auth: UseAuthReturn;
}

const COLUMNS: { title: string; status: TaskStatus }[] = [
  { title: "To Do", status: "todo" },
  { title: "In Progress", status: "in_progress" },
  { title: "Done", status: "done" },
];

export function TaskBoard({ auth }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: "todo",
      });
      setTasks((prev) => [...prev, created]);
      setNewTitle("");
      setNewDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTask(taskId: number) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch (err) {
      setTasks(previous);
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  function handleDragStart(task: Task) {
    setDraggingTask(task);
  }

  function handleDragEnd() {
    setDraggingTask(null);
  }

  async function handleDrop(status: TaskStatus) {
    if (!draggingTask) return;
    if (draggingTask.status === status) {
      setDraggingTask(null);
      return;
    }
    const taskId = draggingTask.id;
    const previous = tasks;
    const targetOrder = tasks.filter((t) => t.status === status).length;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status, order: targetOrder } : t
      )
    );
    setDraggingTask(null);
    try {
      await moveTask(taskId, { status, order: targetOrder });
    } catch (err) {
      setTasks(previous);
      setError(err instanceof Error ? err.message : "Failed to move task");
    }
  }

  const groupedTasks = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">TaskFlow</h1>
            <p className="text-xs text-slate-500">
              Signed in as {auth.user?.name ?? auth.user?.email ?? "user"}
            </p>
          </div>
          <button
            type="button"
            onClick={auth.logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <form
          onSubmit={handleCreateTask}
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              New task
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional details"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Adding…" : "Add task"}
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading tasks…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                title={col.title}
                status={col.status}
                tasks={groupedTasks(col.status)}
                draggingTaskId={draggingTask?.id ?? null}
                onDragStartTask={handleDragStart}
                onDragEndTask={handleDragEnd}
                onDropTask={handleDrop}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
