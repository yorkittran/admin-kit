import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldErrors } from "./field-errors";

interface NumberFieldProps {
  field: AnyFieldApi;
  label: string;
  min?: number;
  step?: number;
}

export function NumberField({ field, label, min, step }: NumberFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type="number"
        min={min}
        step={step}
        value={(field.state.value as number | undefined) ?? 0}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(Number(e.target.value))}
      />
      <FieldErrors field={field} />
    </div>
  );
}
