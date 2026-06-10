import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldErrors } from "./field-errors";

interface TextFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: string;
  placeholder?: string;
}

export function TextField({
  field,
  label,
  type = "text",
  placeholder,
}: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        id={field.name}
        type={type}
        placeholder={placeholder}
        value={(field.state.value as string | null | undefined) ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FieldErrors field={field} />
    </div>
  );
}
