import type { AnyFieldApi } from "@tanstack/react-form";

// Standard-schema validators produce issue objects ({ message }); inline
// validators produce strings. Render both.
function message(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Invalid value";
}

export function FieldErrors({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.isValid) return null;
  return (
    <p className="text-destructive text-sm">
      {field.state.meta.errors.map(message).join(", ")}
    </p>
  );
}
