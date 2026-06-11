import { ilike } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import {
  Languages,
  LayoutDashboard,
  ListChecks,
  Moon,
  Package,
  Plus,
  ScrollText,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { productsCollection } from "@/features/products/collection";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { setTheme } = useTheme();

  useHotkey("Mod+K", () => setOpen((prev) => !prev));
  // Single-key: smart ignoreInputs default already blocks this while typing.
  useHotkey("/", () => {
    document
      .querySelector<HTMLInputElement>('[data-slot="datatable-search"]')
      ?.focus();
  });

  const { data: matches = [] } = useLiveQuery(
    (q) =>
      q
        .from({ p: productsCollection })
        .where(({ p }) => ilike(p.name, `%${search}%`)),
    [search],
  );

  function run(action: () => void) {
    setOpen(false);
    setSearch("");
    action();
  }

  const go = (to: string) => () => router.navigate({ to });

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
      title={m.palette_title()}
      description={m.palette_description()}
    >
      <CommandInput
        placeholder={m.palette_placeholder()}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{m.palette_empty()}</CommandEmpty>
        <CommandGroup heading={m.palette_navigation()}>
          <CommandItem onSelect={() => run(go("/"))}>
            <LayoutDashboard /> {m.nav_dashboard()}
          </CommandItem>
          <CommandItem onSelect={() => run(go("/products"))}>
            <Package /> {m.nav_products()}
          </CommandItem>
          {isAdmin && (
            <CommandItem onSelect={() => run(go("/users"))}>
              <Users /> {m.nav_users()}
            </CommandItem>
          )}
          {isAdmin && (
            <CommandItem onSelect={() => run(go("/audit-log"))}>
              <ScrollText /> {m.nav_audit_log()}
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(go("/profile"))}>
            <User /> {m.nav_profile()}
          </CommandItem>
        </CommandGroup>
        {search.trim() !== "" && matches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={m.palette_products()}>
              {matches.slice(0, 5).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`product-${p.id}-${p.name}`}
                  onSelect={() =>
                    run(() =>
                      router.navigate({
                        to: "/products",
                        search: { q: p.name },
                      }),
                    )
                  }
                >
                  <ListChecks /> {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading={m.palette_actions()}>
          <CommandItem
            onSelect={() =>
              run(() =>
                router.navigate({ to: "/products", search: { new: true } }),
              )
            }
          >
            <Plus /> {m.palette_new_product()}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("light"))}>
            <Sun /> {m.palette_theme()}: {m.theme_light()}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))}>
            <Moon /> {m.palette_theme()}: {m.theme_dark()}
          </CommandItem>
          <CommandItem onSelect={() => run(go("/profile"))}>
            <Languages /> {m.profile_language()}
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(async () => {
                await authClient.signOut();
                window.location.href = "/login";
              })
            }
          >
            {m.nav_sign_out()}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
