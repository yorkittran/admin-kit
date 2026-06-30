import { NumberInput } from "@astryxdesign/core/NumberInput";
import type { AnyFieldApi } from "@tanstack/react-form";
import { fieldErrorText } from "./field-errors";

interface NumberFieldProps {
  field: AnyFieldApi;
  label: string;
  min?: number;
  step?: number;
}

export function NumberField({ field, label, min, step }: NumberFieldProps) {
  const errorText = fieldErrorText(field);
  return (
    <NumberInput
      id={field.name}
      label={label}
      min={min ?? null}
      step={step ?? null}
      value={(field.state.value as number | undefined) ?? 0}
      onBlur={field.handleBlur}
      onChange={(value) => field.handleChange(value)}
      status={errorText ? { type: "error", message: errorText } : undefined}
    />
  );
}
