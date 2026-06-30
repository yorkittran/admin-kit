import { TextArea } from "@astryxdesign/core/TextArea";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldErrorText } from "./field-errors";

interface TextareaFieldProps {
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
}

export function TextareaField({
  field,
  label,
  placeholder,
}: TextareaFieldProps) {
  const errorText = fieldErrorText(field);
  return (
    <TextArea
      id={field.name}
      label={label}
      placeholder={placeholder}
      value={(field.state.value as string | null | undefined) ?? ""}
      onBlur={field.handleBlur}
      onChange={(value) => field.handleChange(value)}
      status={errorText ? { type: "error", message: errorText } : undefined}
    />
  );
}
