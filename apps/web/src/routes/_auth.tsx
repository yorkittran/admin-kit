import { AppShell } from "@astryxdesign/core/AppShell";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) throw redirect({ to: "/" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <AppShell height="fill" contentPadding={4}>
      <Center axis="both" height="100%">
        <Card padding={6} width={384}>
          <Outlet />
        </Card>
      </Center>
    </AppShell>
  );
}
