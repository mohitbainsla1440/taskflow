import 'dotenv/config';
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';

export const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ data: { status: 'ok' } });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
  });
}
