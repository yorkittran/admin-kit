import { QueryClient } from "@tanstack/react-query";

// Shared instance — main.tsx provides it to React Query and TanStack DB
// collections attach to it directly (collections live outside the React tree).
export const queryClient = new QueryClient();
