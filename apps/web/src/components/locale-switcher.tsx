import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { m } from "@/paraglide/messages";
import { getLocale, locales, setLocale } from "@/paraglide/runtime";

const labels: Record<string, string> = { en: "English", vi: "Tiếng Việt" };

// setLocale persists via the localStorage strategy and reloads the page —
// the reload re-renders every compiled message in the new locale.
export function LocaleSwitcher() {
  return (
    <Select
      value={getLocale()}
      onValueChange={(value) => setLocale(value as (typeof locales)[number])}
    >
      <SelectTrigger className="w-40" aria-label={m.profile_language()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {labels[locale] ?? locale}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
