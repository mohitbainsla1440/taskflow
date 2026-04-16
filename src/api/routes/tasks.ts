import { Router, type Request, type Response } from 'express';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { tasks } from '../../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

export const tasksRouter: Router = Router();

type Status = 'todo' | 'in_progress' | 'done';
const STATUSES: readonly Status[] = ['todo', 'in_progress', 'done'];

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

tasksRouter.use(requireAuth);

tasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.status), asc(tasks.order));
    res.status(200).json({ data: rows });
  } catch (err) {
    console.error('list tasks error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

tasksRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, status } = req.body ?? {};
    if (typeof title !== 'string' || !title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const taskStatus: Status = isStatus(status) ? status : 'todo';
    const taskDescription: string | null =
      typeof description === 'string' ? description : null;

    const maxRow = await db
      .select({ max: sql<number | null>`MAX(${tasks.order})` })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, taskStatus)));
    const nextOrder = (maxRow[0]?.max ?? -1) + 1;

    const inserted = await db
      .insert(tasks)
      .values({
        title,
        description: taskDescription,
        status: taskStatus,
        userId,
        order: nextOrder,
      })
      .returning();

    res.status(201).json({ data: inserted[0] });
  } catch (err) {
    console.error('create task error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

tasksRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid task id' });
      return;
    }
    const { title, description } = req.body ?? {};
    const updates: { title?: string; description?: string | null; updatedAt?: Date } = {};
    if (typeof title === 'string') updates.title = title;
    if (description === null || typeof description === 'string') {
      updates.description = description;
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No updatable fields provided' });
      return;
    }
    updates.updatedAt = new Date();

    const updated = await db
      .update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.status(200).json({ data: updated[0] });
  } catch (err) {
    console.error('update task error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

tasksRouter.patch('/:id/move', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid task id' });
      return;
    }
    const { status, order } = req.body ?? {};
    if (!isStatus(status) || !Number.isInteger(order) || order < 0) {
      res.status(400).json({ error: 'status and order are required' });
      return;
    }

    const updated = await db
      .update(tasks)
      .set({ status, order, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.status(200).json({ data: updated[0] });
  } catch (err) {
    console.error('move task error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid task id' });
      return;
    }
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.status(200).json({ data: { id: deleted[0]!.id } });
  } catch (err) {
    console.error('delete task error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
