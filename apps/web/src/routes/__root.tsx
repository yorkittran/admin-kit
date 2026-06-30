import { ToastViewport } from "@astryxdesign/core/Toast";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <ToastViewport position="bottomEnd">
        <Outlet />
      </ToastViewport>
    </ThemeProvider>
  ),
});
