import { AppShell } from "@astryxdesign/core/AppShell";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ScrollText,
  User,
  Users,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

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

function AppLayout() {
  const { session } = Route.useRouteContext();
  const isAdmin = session.user.role === "admin";
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  async function signOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <AppShell
      height="fill"
      variant="elevated"
      contentPadding={6}
      sideNav={
        <SideNav
          header={
            <SideNavHeading heading="admin-kit" headingHref="/" as={Link} />
          }
          footer={
            <HStack gap={2} vAlign="center" className="px-2 py-2">
              <ModeToggle />
              <IconButton
                label={m.nav_sign_out()}
                icon={<Icon icon={LogOut} />}
                variant="ghost"
                size="sm"
                tooltip={m.nav_sign_out()}
                onClick={signOut}
              />
            </HStack>
          }
        >
          <SideNavSection title={m.nav_main()} isHeaderHidden>
            <SideNavItem
              label={m.nav_dashboard()}
              icon={LayoutDashboard}
              isSelected={pathname === "/"}
              as={Link}
              href="/"
            />
            <SideNavItem
              label={m.nav_products()}
              icon={Package}
              isSelected={pathname.startsWith("/products")}
              as={Link}
              href="/products"
            />
            {isAdmin && (
              <SideNavItem
                label={m.nav_users()}
                icon={Users}
                isSelected={pathname.startsWith("/users")}
                as={Link}
                href="/users"
              />
            )}
            {isAdmin && (
              <SideNavItem
                label={m.nav_audit_log()}
                icon={ScrollText}
                isSelected={pathname.startsWith("/audit-log")}
                as={Link}
                href="/audit-log"
              />
            )}
            <SideNavItem
              label={m.nav_profile()}
              icon={User}
              isSelected={pathname.startsWith("/profile")}
              as={Link}
              href="/profile"
            />
          </SideNavSection>
        </SideNav>
      }
    >
      <Outlet />
      <CommandPalette isAdmin={isAdmin} />
    </AppShell>
  );
}
