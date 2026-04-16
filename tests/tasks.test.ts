import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const testDbPath = path.join(
  os.tmpdir(),
  `taskflow-tasks-${process.pid}-${Date.now()}.db`
);
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDbPath;
process.env.JWT_SECRET = "test-secret-tasks";

const { app } = await import("../src/api/index");
const { runMigrations } = await import("../src/db/migrate");
const { sqlite } = await import("../src/db/index");

interface AuthedUser {
  token: string;
  userId: number;
  email: string;
}

async function registerUser(
  email: string,
  name = "Test User"
): Promise<AuthedUser> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123", name });
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${res.text}`);
  }
  return {
    token: res.body.data.token,
    userId: res.body.data.user.id,
    email,
  };
}

async function createTask(
  user: AuthedUser,
  body: Record<string, unknown>
): Promise<{ id: number; title: string; status: string; order: number }> {
  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${user.token}`)
    .send(body);
  if (res.status !== 201) {
    throw new Error(`createTask failed: ${res.status} ${res.text}`);
  }
  return res.body.data;
}

beforeAll(async () => {
  await runMigrations();
});

afterAll(() => {
  sqlite.close();
  try {
    fs.unlinkSync(testDbPath);
  } catch {
    // best-effort cleanup
  }
});

beforeEach(() => {
  sqlite.exec("DELETE FROM tasks; DELETE FROM users;");
});

describe("Task routes auth protection", () => {
  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it("returns 401 when the bearer token is invalid", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns 401 for POST without auth", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "anonymous" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/tasks", () => {
  it("returns only the authenticated user's tasks", async () => {
    const alice = await registerUser("alice@example.com", "Alice");
    const bob = await registerUser("bob@example.com", "Bob");

    await createTask(alice, { title: "Alice todo" });
    await createTask(alice, { title: "Alice done", status: "done" });
    await createTask(bob, { title: "Bob todo" });

    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const t of res.body.data) {
      expect(t.userId).toBe(alice.userId);
    }
  });

  it("returns an empty array when the user has no tasks", async () => {
    const alice = await registerUser("alice@example.com");
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task with default todo status and order 0", async () => {
    const alice = await registerUser("alice@example.com");

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ title: "New task", description: "do the thing" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: "New task",
      description: "do the thing",
      status: "todo",
      userId: alice.userId,
      order: 0,
    });
    expect(res.body.data.id).toEqual(expect.any(Number));
  });

  it("assigns incrementing order within the same status column", async () => {
    const alice = await registerUser("alice@example.com");
    const a = await createTask(alice, { title: "first" });
    const b = await createTask(alice, { title: "second" });
    expect(a.order).toBe(0);
    expect(b.order).toBe(1);
  });

  it("rejects missing title with 400", async () => {
    const alice = await registerUser("alice@example.com");
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ description: "no title" });
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("updates task title and description", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Original" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ title: "Updated", description: "new desc" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated");
    expect(res.body.data.description).toBe("new desc");
  });

  it("returns 404 when updating another user's task", async () => {
    const alice = await registerUser("alice@example.com");
    const bob = await registerUser("bob@example.com");
    const created = await createTask(alice, { title: "Alice task" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ title: "Hacked" });

    expect(res.status).toBe(404);
  });

  it("returns 400 when no updatable fields are provided", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Original" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tasks/:id/move", () => {
  it("moves a task to a new status and order", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Move me" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}/move`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ status: "in_progress", order: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
    expect(res.body.data.order).toBe(0);
  });

  it("rejects an invalid status with 400", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Move me" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}/move`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ status: "pending", order: 0 });
    expect(res.status).toBe(400);
  });

  it("rejects a negative order with 400", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Move me" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}/move`)
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ status: "todo", order: -1 });
    expect(res.status).toBe(400);
  });

  it("returns 404 when moving another user's task", async () => {
    const alice = await registerUser("alice@example.com");
    const bob = await registerUser("bob@example.com");
    const created = await createTask(alice, { title: "Alice task" });

    const res = await request(app)
      .patch(`/api/tasks/${created.id}/move`)
      .set("Authorization", `Bearer ${bob.token}`)
      .send({ status: "done", order: 0 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes the user's own task", async () => {
    const alice = await registerUser("alice@example.com");
    const created = await createTask(alice, { title: "Delete me" });

    const res = await request(app)
      .delete(`/api/tasks/${created.id}`)
      .set("Authorization", `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(created.id);

    const list = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`);
    expect(list.body.data).toHaveLength(0);
  });

  it("returns 404 when deleting another user's task", async () => {
    const alice = await registerUser("alice@example.com");
    const bob = await registerUser("bob@example.com");
    const created = await createTask(alice, { title: "Alice task" });

    const res = await request(app)
      .delete(`/api/tasks/${created.id}`)
      .set("Authorization", `Bearer ${bob.token}`);
    expect(res.status).toBe(404);

    const list = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${alice.token}`);
    expect(list.body.data).toHaveLength(1);
  });

  it("returns 404 for a non-existent task id", async () => {
    const alice = await registerUser("alice@example.com");
    const res = await request(app)
      .delete("/api/tasks/999999")
      .set("Authorization", `Bearer ${alice.token}`);
    expect(res.status).toBe(404);
  });
});
