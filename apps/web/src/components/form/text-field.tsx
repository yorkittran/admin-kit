import { TextInput } from "@astryxdesign/core/TextInput";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldErrorText } from "./field-errors";

interface TextFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function TextField({
  field,
  label,
  type = "text",
  placeholder,
  autoComplete,
}: TextFieldProps) {
  const errorText = fieldErrorText(field);
  // TextInput only accepts 'text' | 'password' | 'email'; fall back to 'text'
  const safeType = type === "password" || type === "email" ? type : "text";
  return (
    <TextInput
      id={field.name}
      label={label}
      type={safeType}
      placeholder={placeholder}
      // autoComplete is not in TextInputProps (BaseProps extends HTMLAttributes, not InputHTMLAttributes)
      value={(field.state.value as string | null | undefined) ?? ""}
      onBlur={field.handleBlur}
      onChange={(value) => field.handleChange(value)}
      status={errorText ? { type: "error", message: errorText } : undefined}
    />
  );
}
