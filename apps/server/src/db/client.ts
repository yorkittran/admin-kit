import {
  accounts,
  products,
  sessions,
  users,
  verifications,
} from "@admin-kit/shared";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "../lib/env";

export const db = drizzle(env.DATABASE_URL, {
  schema: { products, users, sessions, accounts, verifications },
});
