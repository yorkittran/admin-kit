import { TextInput } from "@astryxdesign/core/TextInput";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldErrorText } from "./field-errors";

interface TextFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: "text" | "password" | "email";
  placeholder?: string;
  /**
   * NOTE: Astryx TextInput v0.1.2 has no autoComplete prop, so this is
   * currently NOT forwarded to the DOM input. Kept for intent/forward-compat;
   * htmlName is set as the autofill anchor.
   */
  autoComplete?: string;
}

export function TextField({
  field,
  label,
  type = "text",
  placeholder,
}: TextFieldProps) {
  const errorText = fieldErrorText(field);
  return (
    <TextInput
      id={field.name}
      htmlName={field.name}
      label={label}
      type={type}
      placeholder={placeholder}
      value={(field.state.value as string | null | undefined) ?? ""}
      onBlur={field.handleBlur}
      onChange={(value) => field.handleChange(value)}
      status={errorText ? { type: "error", message: errorText } : undefined}
    />
  );
}
