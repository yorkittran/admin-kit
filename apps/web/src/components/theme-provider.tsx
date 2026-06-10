import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEMES: readonly Theme[] = ["dark", "light", "system"];

function getStoredTheme(key: string): Theme | null {
  try {
    const stored = localStorage.getItem(key);
    return THEMES.includes(stored as Theme) ? (stored as Theme) : null;
  } catch {
    return null;
  }
}

function storeTheme(key: string, value: Theme) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable (e.g. private browsing) — theme just won't persist
  }
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "admin-kit-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<Theme>(
    () => getStoredTheme(storageKey) ?? defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;

    const applyResolved = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
    };

    applyResolved();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", applyResolved);
      return () => mq.removeEventListener("change", applyResolved);
    }
  }, [theme]);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme: (t) => {
          storeTheme(storageKey, t);
          setTheme(t);
        },
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeProviderContext);
