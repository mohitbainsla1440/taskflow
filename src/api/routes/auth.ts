import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { sign } from '../lib/jwt.js';

export const authRouter: Router = Router();

const SALT_ROUNDS = 10;

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body ?? {};
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof name !== 'string' ||
      !email ||
      !password ||
      !name
    ) {
      res.status(400).json({ error: 'email, password, and name are required' });
      return;
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const inserted = await db
      .insert(users)
      .values({ email, password: hashed, name })
      .returning({ id: users.id, email: users.email, name: users.name });

    const user = inserted[0];
    if (!user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    const token = sign({ userId: user.id, email: user.email });
    res.status(201).json({ data: { token, user } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email ||
      !password
    ) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = sign({ userId: user.id, email: user.email });
    res.status(200).json({
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
