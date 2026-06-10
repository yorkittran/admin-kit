import {
  ProductInsertSchema,
  type StandardSchema,
  toStandardSchema,
} from "@admin-kit/shared";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { NumberField } from "@/components/form/number-field";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProductMutationError,
  type ProductRow,
  productsCollection,
} from "./collection";

type ProductFormValues = {
  name: string;
  description: string;
  priceCents: number;
  status: "active" | "archived";
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

interface ProductFormDialogProps {
  product?: ProductRow; // present = edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductFormDialog({
  product,
  open,
  onOpenChange,
}: ProductFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      priceCents: product?.priceCents ?? 0,
      status: product?.status ?? ("active" as "active" | "archived"),
    },
    validators: {
      // The TypeBox schema has description?: string | null | undefined while the
      // form value uses string — cast to the concrete form type so TanStack Form
      // can infer field-level errors without an as-any escape hatch.
      onChange: toStandardSchema(
        ProductInsertSchema,
      ) as StandardSchema<ProductFormValues>,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const description =
        value.description.trim() === "" ? null : value.description;
      try {
        if (product) {
          const tx = productsCollection.update(product.id, (draft) => {
            draft.name = value.name;
            draft.description = description;
            draft.priceCents = value.priceCents;
            draft.status = value.status;
          });
          await tx.isPersisted.promise;
          toast.success("Product updated");
        } else {
          // Client-generated id is optimistic-only; the server assigns the
          // real uuidv7 and the post-persist refetch reconciles the row.
          const now = new Date().toISOString();
          const tx = productsCollection.insert({
            id: crypto.randomUUID(),
            name: value.name,
            description,
            priceCents: value.priceCents,
            status: value.status,
            createdAt: now,
            updatedAt: now,
          });
          await tx.isPersisted.promise;
          toast.success("Product created");
        }
        onOpenChange(false);
        form.reset();
      } catch (error) {
        if (
          error instanceof ProductMutationError &&
          error.status === 422 &&
          error.property &&
          ["name", "description", "priceCents", "status"].includes(
            error.property,
          )
        ) {
          form.setFieldMeta(
            error.property as "name" | "description" | "priceCents" | "status",
            (prev) => ({
              ...prev,
              errorMap: { ...prev.errorMap, onServer: error.message },
            }),
          );
          return;
        }
        setServerError(
          error instanceof ProductMutationError
            ? error.message
            : "Could not save product. Check your connection.",
        );
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details."
              : "Add a product to the catalog."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => <TextField field={field} label="Name" />}
          </form.Field>
          <form.Field name="description">
            {(field) => <TextareaField field={field} label="Description" />}
          </form.Field>
          <form.Field name="priceCents">
            {(field) => (
              <NumberField
                field={field}
                label="Price (cents)"
                min={0}
                step={1}
              />
            )}
          </form.Field>
          <form.Field name="status">
            {(field) => (
              <SelectField
                field={field}
                label="Status"
                options={STATUS_OPTIONS}
              />
            )}
          </form.Field>
          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="justify-self-end"
              >
                {isSubmitting
                  ? "Saving…"
                  : product
                    ? "Save changes"
                    : "Create product"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
