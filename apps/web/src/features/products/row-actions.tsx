import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
} from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/lib/toast";
import { m } from "@/paraglide/messages";
import {
  ProductMutationError,
  type ProductRow,
  productsCollection,
} from "./collection";
import { ProductFormDialog } from "./form";

export function ProductRowActions({ product }: { product: ProductRow }) {
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setConfirmOpen(false);
    try {
      const tx = productsCollection.delete(product.id);
      await tx.isPersisted.promise;
      toast.success(m.products_deleted_toast());
    } catch (error) {
      toast.error(
        error instanceof ProductMutationError
          ? error.message
          : m.products_delete_error(),
      );
    }
  }

  return (
    <>
      <DropdownMenu
        button={{
          label: m.products_actions_for({ name: product.name }),
          icon: <Icon icon="moreHorizontal" />,
          variant: "ghost",
          isIconOnly: true,
        }}
        hasChevron={false}
        items={[
          {
            label: m.common_edit(),
            icon: <Icon icon={Pencil} size="sm" />,
            onClick: () => setEditOpen(true),
          },
          {
            label: m.common_delete(),
            icon: <Icon icon={Trash2} size="sm" />,
            onClick: () => setConfirmOpen(true),
          },
        ]}
      />
      {editOpen && (
        <ProductFormDialog
          product={product}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
      <Dialog isOpen={confirmOpen} onOpenChange={setConfirmOpen} width={400}>
        <Layout
          height="auto"
          header={
            <DialogHeader
              title={m.products_delete_confirm_title()}
              onOpenChange={setConfirmOpen}
            />
          }
          content={
            <LayoutContent>
              <Text type="body">
                {m.products_delete_confirm_body({ name: product.name })}
              </Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} hAlign="end">
                <Button
                  label={m.common_cancel()}
                  variant="secondary"
                  onClick={() => setConfirmOpen(false)}
                />
                <Button
                  label={m.common_delete()}
                  variant="destructive"
                  clickAction={handleDelete}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </>
  );
}
