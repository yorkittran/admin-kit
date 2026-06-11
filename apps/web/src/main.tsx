import { TanStackDevtools } from "@tanstack/react-devtools";
import { pacerDevtoolsPlugin } from "@tanstack/react-pacer-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* No TanStack DB panel exists yet (spec lists one) — add when published. */}
      <TanStackDevtools
        plugins={[
          { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          pacerDevtoolsPlugin(),
        ]}
      />
    </QueryClientProvider>
  </StrictMode>,
);
