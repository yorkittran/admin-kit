import type { App } from "@admin-kit/server";
import { treaty } from "@elysiajs/eden";

export const api = treaty<App>(
  import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  {
    fetch: { credentials: "include" },
  },
);
