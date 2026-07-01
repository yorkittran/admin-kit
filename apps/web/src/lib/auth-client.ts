import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { API_BASE_URL } from "./base-url";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: { credentials: "include" },
  plugins: [adminClient()],
});
