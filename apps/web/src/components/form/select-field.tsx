import { Selector } from "@astryxdesign/core/Selector";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldErrorText } from "./field-errors";

interface SelectFieldProps {
  field: AnyFieldApi;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({
  field,
  label,
  options,
  placeholder,
}: SelectFieldProps) {
  const errorText = fieldErrorText(field);
  return (
    <Selector
      label={label}
      placeholder={placeholder}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      value={(field.state.value as string | undefined) ?? ""}
      onBlur={field.handleBlur}
      onChange={(value) => field.handleChange(value)}
      status={errorText ? { type: "error", message: errorText } : undefined}
    />
  );
}
