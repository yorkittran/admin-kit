import {
  createFileRoute,
  Link,
  type LinkProps,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { session };
  },
  component: AppLayout,
});

function NavLink({
  to,
  children,
}: {
  to: LinkProps["to"];
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-sm hover:bg-accent"
      activeProps={{
        className: "rounded-md bg-accent px-3 py-2 font-medium text-sm",
      }}
    >
      {children}
    </Link>
  );
}

function AppLayout() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const isAdmin = session.user.role === "admin";

  async function signOut() {
    await authClient.signOut();
    await router.navigate({ to: "/login", search: { redirect: undefined } });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r p-4">
        <span className="mb-6 px-3 font-bold text-lg">admin-kit</span>
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/">Dashboard</NavLink>
          {isAdmin && <NavLink to="/users">Users</NavLink>}
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="flex items-center justify-between">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
