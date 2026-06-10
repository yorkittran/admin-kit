import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String({ minLength: 1 }),
  PORT: Type.Number({ default: 3000 }),
  WEB_ORIGIN: Type.String({ default: "http://localhost:5173" }),
  LOG_LEVEL: Type.String({ default: "info" }),
  BETTER_AUTH_SECRET: Type.String({ minLength: 1 }),
  BETTER_AUTH_URL: Type.String({ default: "http://localhost:3000" }),
  SMTP_HOST: Type.String({ default: "localhost" }),
  SMTP_PORT: Type.Number({ default: 1025 }),
  EMAIL_FROM: Type.String({ default: "admin-kit <noreply@admin-kit.local>" }),
});

const candidate = Value.Clean(
  EnvSchema,
  Value.Convert(EnvSchema, Value.Default(EnvSchema, { ...process.env })),
);

if (!Value.Check(EnvSchema, candidate)) {
  const details = [...Value.Errors(EnvSchema, candidate)]
    .map((e) => `  ${e.path}: ${e.message}`)
    .join("\n");
  throw new Error(`Invalid environment:\n${details}`);
}

export const env = candidate;
