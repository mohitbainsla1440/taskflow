# TaskFlow — Full-Stack Task Management Dashboard

## Overview
TaskFlow is a Kanban-style task management app with user authentication, persistent storage, and a polished React frontend. Users can register, login, create tasks, and drag them between columns (To Do, In Progress, Done).

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite with Drizzle ORM
- **Auth:** JWT-based (register, login, protected routes)
- **Package Manager:** npm

## Project Structure

```
taskflow/
├── CLAUDE.md
├── package.json              # root workspace (scripts to run both)
├── src/
│   ├── db/                   # DB Engineer owns this
│   │   ├── schema.ts         # Drizzle schema (users, tasks, columns)
│   │   ├── migrate.ts        # migration runner
│   │   ├── seed.ts           # seed data for development
│   │   └── index.ts          # db connection + export
│   ├── api/                  # Backend Dev owns this
│   │   ├── index.ts          # Express app entry point
│   │   ├── routes/
│   │   │   ├── auth.ts       # POST /api/auth/register, POST /api/auth/login
│   │   │   └── tasks.ts      # CRUD /api/tasks, PATCH /api/tasks/:id/move
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT verification middleware
│   │   └── lib/
│   │       └── jwt.ts        # token sign/verify helpers
│   └── client/               # Frontend Dev owns this
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   ├── TaskBoard.tsx
│       │   ├── KanbanColumn.tsx
│       │   └── TaskCard.tsx
│       ├── hooks/
│       │   └── useAuth.ts
│       ├── lib/
│       │   └── api.ts        # fetch wrapper with auth token
│       └── styles/
│           └── globals.css
├── tests/                    # Integrator owns this
│   ├── auth.test.ts
│   └── tasks.test.ts
└── .env                      # JWT_SECRET, PORT, DATABASE_URL
```

## File Ownership Rules (CRITICAL)
Each agent must ONLY create and edit files in their assigned directory. This prevents merge conflicts.

| Agent | Owned Directory | Do NOT touch |
|-------|----------------|--------------|
| DB Engineer | `src/db/` | `src/api/`, `src/client/`, `tests/` |
| Backend Dev | `src/api/` | `src/db/`, `src/client/`, `tests/` |
| Frontend Dev | `src/client/` | `src/db/`, `src/api/`, `tests/` |
| Integrator | `tests/`, `src/client/lib/api.ts`, `.env` | `src/db/` |

## Database Schema

### users
- `id` — integer, primary key, auto-increment
- `email` — text, unique, not null
- `password` — text, not null (hashed with bcrypt)
- `name` — text, not null
- `createdAt` — timestamp, default now

### tasks
- `id` — integer, primary key, auto-increment
- `title` — text, not null
- `description` — text, nullable
- `status` — text, not null, one of: `todo`, `in_progress`, `done`
- `userId` — integer, foreign key → users.id
- `order` — integer, not null (position within column)
- `createdAt` — timestamp, default now
- `updatedAt` — timestamp, default now

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create user, return JWT |
| POST | `/api/auth/login` | No | Verify creds, return JWT |
| GET | `/api/tasks` | Yes | Get all tasks for logged-in user |
| POST | `/api/tasks` | Yes | Create a new task |
| PATCH | `/api/tasks/:id` | Yes | Update task title/description |
| PATCH | `/api/tasks/:id/move` | Yes | Move task to new status/order |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |

## Coding Standards
- TypeScript strict mode everywhere
- Use `async/await`, no raw callbacks
- Express error handling: wrap async routes with try/catch, return proper HTTP status codes
- Frontend: functional components only, no class components
- Use named exports, not default exports
- All API responses follow: `{ data: T }` for success, `{ error: string }` for failure
- Passwords hashed with bcrypt (min 10 salt rounds)
- JWT tokens expire in 7 days
- CORS enabled for `http://localhost:5173` (Vite dev server)

## Running the Project
```bash
# Install dependencies
npm install

# Run database migrations
npx tsx src/db/migrate.ts

# Seed development data
npx tsx src/db/seed.ts

# Start backend (port 3001)
npx tsx src/api/index.ts

# Start frontend (port 5173)
cd src/client && npx vite
```
