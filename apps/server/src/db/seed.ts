import { accounts, users } from "@admin-kit/shared";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "./client";

const email = "admin@admin-kit.local";
const password = "admin123456";

const existing = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, email));

if (existing.length > 0) {
  console.log(`${email} already seeded`);
  process.exit(0);
}

const userId = Bun.randomUUIDv7();
const now = new Date();

await db.insert(users).values({
  id: userId,
  name: "Admin",
  email,
  emailVerified: true,
  role: "admin",
  createdAt: now,
  updatedAt: now,
});

await db.insert(accounts).values({
  id: Bun.randomUUIDv7(),
  accountId: userId,
  providerId: "credential",
  userId,
  password: await hashPassword(password),
  createdAt: now,
  updatedAt: now,
});

console.log(`seeded ${email} / ${password}`);
process.exit(0);
