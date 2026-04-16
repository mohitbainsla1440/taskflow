import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const testDbPath = path.join(
  os.tmpdir(),
  `taskflow-auth-${process.pid}-${Date.now()}.db`
);
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDbPath;
process.env.JWT_SECRET = "test-secret-auth";

const { app } = await import("../src/api/index");
const { runMigrations } = await import("../src/db/migrate");
const { sqlite } = await import("../src/db/index");

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

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a JWT + user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@example.com", password: "hunter2", name: "Alice" });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      email: "alice@example.com",
      name: "Alice",
    });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.error).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    const payload = {
      email: "dup@example.com",
      password: "hunter2",
      name: "Dup",
    };
    await request(app).post("/api/auth/register").send(payload).expect(201);

    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "only@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      email: "bob@example.com",
      password: "correct-horse",
      name: "Bob",
    });
  });

  it("returns a token on valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "correct-horse" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      email: "bob@example.com",
      name: "Bob",
    });
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.any(String));
    expect(res.body.data).toBeUndefined();
  });

  it("rejects an unknown user with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "correct-horse" });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com" });

    expect(res.status).toBe(400);
  });
});
