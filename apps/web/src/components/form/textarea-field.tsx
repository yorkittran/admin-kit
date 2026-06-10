import type { AnyFieldApi } from "@tanstack/react-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldErrors } from "./field-errors";

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
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Textarea
        id={field.name}
        placeholder={placeholder}
        value={(field.state.value as string | null | undefined) ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      <FieldErrors field={field} />
    </div>
  );
}
