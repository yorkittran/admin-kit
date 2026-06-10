import nodemailer from "nodemailer";
import { env } from "../lib/env";

// Mailpit locally (no auth); real SMTP creds get added via env when deploying
export const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
});
