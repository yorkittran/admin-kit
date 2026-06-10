import { PgBoss } from "pg-boss";
import { env } from "../lib/env";
import { logger } from "../lib/logger";

export const SEND_EMAIL_QUEUE = "send-email";

export type SendEmailJob = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export const boss = new PgBoss(env.DATABASE_URL);

boss.on("error", (error) => logger.error(error, "pg-boss error"));
