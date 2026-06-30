import type { AnyFieldApi } from "@tanstack/react-form";

// Standard-schema validators produce issue objects ({ message }); inline
// validators produce strings. Render both.
export function message(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Invalid value";
}

/** Computes the joined error string when the field is touched and invalid. */
export function fieldErrorText(field: AnyFieldApi): string | undefined {
  if (!field.state.meta.isTouched || field.state.meta.isValid) return undefined;
  return field.state.meta.errors.map(message).join(", ");
}

export function FieldErrors({ field }: { field: AnyFieldApi }) {
  const text = fieldErrorText(field);
  if (!text) return null;
  return <p className="text-destructive text-sm">{text}</p>;
}
