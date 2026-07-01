import type { App } from "@admin-kit/server";
import { treaty } from "@elysiajs/eden";
import { API_BASE_URL } from "./base-url";

export const api = treaty<App>(API_BASE_URL, {
  fetch: { credentials: "include" },
});
