import type { AnyFieldApi } from "@tanstack/react-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldErrors } from "./field-errors";

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
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Select
        value={(field.state.value as string | undefined) ?? ""}
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger id={field.name} onBlur={field.handleBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldErrors field={field} />
    </div>
  );
}
