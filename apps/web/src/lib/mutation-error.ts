// Decodes an Eden/Elysia error-envelope value to a human-readable string.
// Order matches Elysia's shapes: 422 carries `summary`; route-level errors carry
// `message`; some errors are a bare string. Returns undefined when nothing usable
// is present so callers supply their own Paraglide fallback message.
export function decodeErrorMessage(value: unknown): string | undefined {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.summary === "string") return record.summary;
    if (typeof record.message === "string") return record.message;
    return undefined;
  }
  return typeof value === "string" ? value : undefined;
}
