import type { App } from "@admin-kit/server";
import { treaty } from "@elysiajs/eden";

// `||` not `??` — an unset VITE_API_URL build arg inlines as "" and must still fall back
export const api = treaty<App>(
  import.meta.env.VITE_API_URL || "http://localhost:3000",
  {
    fetch: { credentials: "include" },
  },
);
