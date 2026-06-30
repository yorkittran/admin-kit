import { Selector } from "@astryxdesign/core/Selector";
import { m } from "@/paraglide/messages";
import { getLocale, locales, setLocale } from "@/paraglide/runtime";

const labels: Record<string, string> = { en: "English", vi: "Tiếng Việt" };

const options = locales.map((locale) => ({
  value: locale,
  label: labels[locale] ?? locale,
}));

// setLocale persists via the localStorage strategy and reloads the page —
// the reload re-renders every compiled message in the new locale.
export function LocaleSwitcher() {
  return (
    <Selector
      label={m.profile_language()}
      isLabelHidden
      options={options}
      value={getLocale()}
      onChange={(value) => setLocale(value as (typeof locales)[number])}
      size="sm"
    />
  );
}
