import {
  CommandPalette as AstryxCommandPalette,
  CommandPaletteInput,
} from "@astryxdesign/core/CommandPalette";
import { Icon } from "@astryxdesign/core/Icon";
import type {
  SearchableItem,
  SearchSource,
} from "@astryxdesign/core/Typeahead";
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

interface PaletteAux {
  group: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

type PaletteItem = SearchableItem<PaletteAux>;

export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  useHotkey("Mod+K", () => setOpen((prev) => !prev));
  // Single-key: smart ignoreInputs default already blocks this while typing.
  useHotkey("/", () => {
    document
      .querySelector<HTMLInputElement>('[data-slot="datatable-search"]')
      ?.focus();
  });

  // Live-loaded products (reactive over the locally-synced collection). This
  // query does NOT depend on the typed query — searchSource.search() filters
  // these rows by name client-side, which is equivalent to the old ilike read
  // (TanStack DB live queries already run over the local store).
  const { data: allProducts = [] } = useLiveQuery((q) =>
    q.from({ p: productsCollection }),
  );

  // Stash in a ref so the stable searchSource closure reads the latest rows.
  const allProductsRef = useRef(allProducts);
  allProductsRef.current = allProducts;

  const run = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const go = useCallback(
    (to: string) => () => router.navigate({ to }),
    [router],
  );

  // Rebuilt only when admin status or i18n changes.
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
      ...(isAdmin
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
  }, [isAdmin]);

  // Custom SearchSource: the single source of truth for what renders.
  // Astryx's default input drives ctx.setSearch -> runSearch(query), and
  // runSearch is the only caller of bootstrap()/search(). The object is stable
  // and reads the latest static items / product rows via refs.
  const staticItemsRef = useRef(staticItems);
  staticItemsRef.current = staticItems;

  const searchSource = useMemo<SearchSource<PaletteItem>>(
    () => ({
      // Empty-query state: the full static list (nav + actions).
      bootstrap(): PaletteItem[] {
        return staticItemsRef.current;
      },
      // Active query: filtered static items + up to 5 product matches.
      search(query: string): PaletteItem[] {
        const lower = query.toLowerCase().trim();
        const filtered = staticItemsRef.current.filter((item) =>
          item.label.toLowerCase().includes(lower),
        );
        const productItems: PaletteItem[] = allProductsRef.current
          .filter((p) => p.name.toLowerCase().includes(lower))
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
        const product = allProductsRef.current.find(
          (p) => String(p.id) === productId,
        );
        if (product) {
          run(() =>
            router.navigate({ to: "/products", search: { q: product.name } }),
          );
        }
      }
    },
    [go, router, setTheme, run],
  );

  // Custom input slot: passes ONLY the localized placeholder. With no
  // onValueChange/value, CommandPaletteInput falls back to context
  // (handleValueChange = onValueChange ?? ctx.setSearch), so ctx.setSearch
  // drives runSearch -> searchSource.search and the input shows typed text.
  const inputSlot = useMemo(
    () => <CommandPaletteInput placeholder={m.palette_placeholder()} />,
    [],
  );

  return (
    <AstryxCommandPalette
      isOpen={open}
      onOpenChange={setOpen}
      searchSource={searchSource}
      input={inputSlot}
      // Astryx CommandPalette has only a `label` prop (no description slot),
      // so m.palette_description() has no place to render; the key is kept in
      // the catalogs for forward-compat. Accepted, documented deviation.
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
