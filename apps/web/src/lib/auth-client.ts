import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // `||` not `??` — an unset VITE_API_URL build arg inlines as "" and must still fall back
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  fetchOptions: { credentials: "include" },
  plugins: [adminClient()],
});
