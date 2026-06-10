import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const EnvSchema = Type.Object({
  DATABASE_URL: Type.String({ minLength: 1 }),
  PORT: Type.Number({ default: 3000 }),
  WEB_ORIGIN: Type.String({ default: "http://localhost:5173" }),
  LOG_LEVEL: Type.String({ default: "info" }),
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
