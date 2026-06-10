import { ProductInsertSchema, ProductUpdateSchema } from "@admin-kit/shared";
import { Elysia, t } from "elysia";
import { betterAuthPlugin } from "../../auth/plugin";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "./service";

const idParams = t.Object({ id: t.String({ format: "uuid" }) });

export const productsModule = new Elysia({ prefix: "/products" })
  .use(betterAuthPlugin)
  .get("/", () => listProducts(), { auth: true })
  .post("/", ({ body, user }) => createProduct(user.id, body), {
    auth: true,
    body: ProductInsertSchema,
  })
  .patch(
    "/:id",
    async ({ params, body, user, status }) => {
      const updated = await updateProduct(user.id, params.id, body);
      if (!updated) return status(404, { message: "Product not found" });
      return updated;
    },
    { auth: true, body: ProductUpdateSchema, params: idParams },
  )
  .delete(
    "/:id",
    async ({ params, user, status }) => {
      const deleted = await deleteProduct(user.id, params.id);
      if (!deleted) return status(404, { message: "Product not found" });
      return deleted;
    },
    { auth: true, params: idParams },
  );
