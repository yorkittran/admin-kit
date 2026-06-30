import {
  CommandPalette,
  CommandPaletteInput,
} from "@astryxdesign/core/CommandPalette";
import { Icon } from "@astryxdesign/core/Icon";
import type {
  SearchableItem,
  SearchSource,
} from "@astryxdesign/core/Typeahead";
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
import { useCallback, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { productsCollection } from "@/features/products/collection";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

// ---------- item id constants ----------

const NAV_DASHBOARD = "nav-dashboard";
const NAV_PRODUCTS = "nav-products";
const NAV_USERS = "nav-users";
const NAV_AUDIT_LOG = "nav-audit-log";
const NAV_PROFILE = "nav-profile";
const ACTION_NEW_PRODUCT = "action-new-product";
const ACTION_THEME_LIGHT = "action-theme-light";
const ACTION_THEME_DARK = "action-theme-dark";
const ACTION_LANGUAGE = "action-language";
const ACTION_SIGN_OUT = "action-sign-out";

const PRODUCT_PREFIX = "product-";

// ---------- item type ----------

interface PaletteAux {
  group: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

type PaletteItem = SearchableItem<PaletteAux>;

// ---------- component ----------

export function CommandPalette_({ isAdmin }: { isAdmin: boolean }) {
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

  // Keep a ref to matches so the searchSource closure can read the latest value.
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  function run(action: () => void) {
    setOpen(false);
    setSearch("");
    action();
  }

  const go = useCallback(
    (to: string) => () => router.navigate({ to }),
    [router],
  );

  // Build static items (navigation + actions).
  // These are rebuilt only when admin status or i18n changes.
  const staticItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [
      {
        id: NAV_DASHBOARD,
        label: m.nav_dashboard(),
        auxiliaryData: { group: m.palette_navigation(), icon: LayoutDashboard },
      },
      {
        id: NAV_PRODUCTS,
        label: m.nav_products(),
        auxiliaryData: { group: m.palette_navigation(), icon: Package },
      },
      ...(isAdminRef.current
        ? [
            {
              id: NAV_USERS,
              label: m.nav_users(),
              auxiliaryData: { group: m.palette_navigation(), icon: Users },
            } satisfies PaletteItem,
            {
              id: NAV_AUDIT_LOG,
              label: m.nav_audit_log(),
              auxiliaryData: {
                group: m.palette_navigation(),
                icon: ScrollText,
              },
            } satisfies PaletteItem,
          ]
        : []),
      {
        id: NAV_PROFILE,
        label: m.nav_profile(),
        auxiliaryData: { group: m.palette_navigation(), icon: User },
      },
      {
        id: ACTION_NEW_PRODUCT,
        label: m.palette_new_product(),
        auxiliaryData: { group: m.palette_actions(), icon: Plus },
      },
      {
        id: ACTION_THEME_LIGHT,
        label: `${m.palette_theme()}: ${m.theme_light()}`,
        auxiliaryData: { group: m.palette_actions(), icon: Sun },
      },
      {
        id: ACTION_THEME_DARK,
        label: `${m.palette_theme()}: ${m.theme_dark()}`,
        auxiliaryData: { group: m.palette_actions(), icon: Moon },
      },
      {
        id: ACTION_LANGUAGE,
        label: m.profile_language(),
        auxiliaryData: { group: m.palette_actions(), icon: Languages },
      },
      {
        id: ACTION_SIGN_OUT,
        label: m.nav_sign_out(),
        auxiliaryData: { group: m.palette_actions() },
      },
    ];
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Custom SearchSource: combines filtered static items with live product matches.
  // The searchSource object is stable; it reads the latest matches/items via refs.
  const staticItemsRef = useRef(staticItems);
  staticItemsRef.current = staticItems;

  const searchSource = useMemo<SearchSource<PaletteItem>>(
    () => ({
      bootstrap(): PaletteItem[] {
        return staticItemsRef.current;
      },
      search(query: string): PaletteItem[] {
        const lower = query.toLowerCase().trim();
        const filtered = staticItemsRef.current.filter((item) =>
          item.label.toLowerCase().includes(lower),
        );
        // Product matches (live query already filtered by ilike; take first 5)
        const productItems: PaletteItem[] = matchesRef.current
          .slice(0, 5)
          .map((p) => ({
            id: `${PRODUCT_PREFIX}${p.id}`,
            label: p.name,
            auxiliaryData: { group: m.palette_products(), icon: ListChecks },
          }));
        return [...filtered, ...productItems];
      },
    }),
    // Intentionally stable — reads current values via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Dispatch the action that corresponds to the selected item id.
  const handleValueChange = useCallback(
    (value: string) => {
      if (value === NAV_DASHBOARD) {
        run(go("/"));
      } else if (value === NAV_PRODUCTS) {
        run(go("/products"));
      } else if (value === NAV_USERS) {
        run(go("/users"));
      } else if (value === NAV_AUDIT_LOG) {
        run(go("/audit-log"));
      } else if (value === NAV_PROFILE) {
        run(go("/profile"));
      } else if (value === ACTION_NEW_PRODUCT) {
        run(() => router.navigate({ to: "/products", search: { new: true } }));
      } else if (value === ACTION_THEME_LIGHT) {
        run(() => setTheme("light"));
      } else if (value === ACTION_THEME_DARK) {
        run(() => setTheme("dark"));
      } else if (value === ACTION_LANGUAGE) {
        run(go("/profile"));
      } else if (value === ACTION_SIGN_OUT) {
        run(async () => {
          await authClient.signOut();
          window.location.href = "/login";
        });
      } else if (value.startsWith(PRODUCT_PREFIX)) {
        const productId = value.slice(PRODUCT_PREFIX.length);
        const product = matchesRef.current.find(
          (p) => String(p.id) === productId,
        );
        if (product) {
          run(() =>
            router.navigate({ to: "/products", search: { q: product.name } }),
          );
        }
      }
    },
    [go, router, setTheme],
  );

  // Custom input slot: intercepts onValueChange to also update external `search`
  // state (which drives the useLiveQuery for product matches).
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const inputSlot = useMemo(
    () => (
      <CommandPaletteInput
        placeholder={m.palette_placeholder()}
        onValueChange={handleSearchChange}
      />
    ),
    [handleSearchChange],
  );

  return (
    <CommandPalette
      isOpen={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
      searchSource={searchSource}
      input={inputSlot}
      label={m.palette_title()}
      emptySearchText={m.palette_empty()}
      emptyBootstrapText={m.palette_empty()}
      onValueChange={handleValueChange}
      renderItem={(item: PaletteItem) => {
        const IconComp = item.auxiliaryData?.icon;
        return (
          <>
            {IconComp && <Icon icon={IconComp} size="sm" />}
            {item.label}
          </>
        );
      }}
    />
  );
}

// Re-export with the expected public name
export { CommandPalette_ as CommandPalette };
