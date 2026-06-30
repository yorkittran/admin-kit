import {
  ProductInsertSchema,
  type StandardSchema,
  toStandardSchema,
} from "@admin-kit/shared";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { NumberField } from "@/components/form/number-field";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { TextareaField } from "@/components/form/textarea-field";
import { useToast } from "@/lib/toast";
import { m } from "@/paraglide/messages";
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

// Module-load m.* is safe: setLocale() reloads the page (see locale-switcher.tsx).
const STATUS_OPTIONS = [
  { value: "active", label: m.products_status_active() },
  { value: "archived", label: m.products_status_archived() },
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
  const toast = useToast();
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
          toast.success(m.products_updated_toast());
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
          toast.success(m.products_created_toast());
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
            : m.products_save_error(),
        );
      }
    },
  });

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      purpose="form"
      width={480}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <Layout
          height="auto"
          header={
            <DialogHeader
              title={
                product ? m.products_edit_title() : m.products_create_title()
              }
              subtitle={
                product
                  ? m.products_edit_description()
                  : m.products_create_description()
              }
              onOpenChange={onOpenChange}
            />
          }
          content={
            <LayoutContent>
              <VStack gap={4}>
                <form.Field name="name">
                  {(field) => (
                    <TextField field={field} label={m.products_name_label()} />
                  )}
                </form.Field>
                <form.Field name="description">
                  {(field) => (
                    <TextareaField
                      field={field}
                      label={m.products_description_label()}
                    />
                  )}
                </form.Field>
                <form.Field name="priceCents">
                  {(field) => (
                    <NumberField
                      field={field}
                      label={m.products_price_label()}
                      min={0}
                      step={1}
                    />
                  )}
                </form.Field>
                <form.Field name="status">
                  {(field) => (
                    <SelectField
                      field={field}
                      label={m.products_status_label()}
                      options={STATUS_OPTIONS}
                    />
                  )}
                </form.Field>
                {serverError && <Banner status="error" title={serverError} />}
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} hAlign="end">
                <Button
                  label={m.common_cancel()}
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                />
                <form.Subscribe
                  selector={(state) =>
                    [state.canSubmit, state.isSubmitting] as const
                  }
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      label={
                        isSubmitting
                          ? m.common_saving()
                          : product
                            ? m.products_save_changes()
                            : m.products_create_title()
                      }
                      variant="primary"
                      isDisabled={!canSubmit || isSubmitting}
                      isLoading={isSubmitting}
                    />
                  )}
                </form.Subscribe>
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
