import bcrypt from "bcrypt";
import { db } from "./index";
import { runMigrations } from "./migrate";
import { tasks, users } from "./schema";

export const seed = async (): Promise<void> => {
  await runMigrations();

  await db.delete(tasks);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [alice] = await db
    .insert(users)
    .values({
      email: "alice@example.com",
      password: passwordHash,
      name: "Alice Anderson",
    })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      email: "bob@example.com",
      password: passwordHash,
      name: "Bob Barker",
    })
    .returning();

  if (!alice || !bob) {
    throw new Error("Failed to seed users");
  }

  await db.insert(tasks).values([
    {
      title: "Design login screen",
      description: "Wireframe and mock the login screen",
      status: "todo",
      userId: alice.id,
      order: 0,
    },
    {
      title: "Set up CI pipeline",
      description: "GitHub Actions for lint, test, build",
      status: "in_progress",
      userId: alice.id,
      order: 0,
    },
    {
      title: "Write onboarding docs",
      description: null,
      status: "done",
      userId: alice.id,
      order: 0,
    },
    {
      title: "Review PR #42",
      description: "Check backend auth changes",
      status: "todo",
      userId: bob.id,
      order: 0,
    },
  ]);

  console.log("Seed complete: 2 users, 4 tasks.");
};

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
