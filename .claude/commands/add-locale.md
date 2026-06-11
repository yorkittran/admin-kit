---
description: Add a new UI locale (copy en catalog, register locale, wire switcher)
argument-hint: <locale-code e.g. ja>
---

Add the locale "$1" to the web app:

1. Add "$1" to the `locales` array in `apps/web/project.inlang/settings.json`.
2. Copy `apps/web/messages/en.json` to `apps/web/messages/$1.json` and translate every value to $1 (keep keys and `{param}` placeholders identical).
3. Run `bun --cwd=apps/web run paraglide:compile` — must pass with no missing-message warnings.
4. Add the locale option to `apps/web/src/components/locale-switcher.tsx` (label in the language's own name).
5. Run `bun run check`, then start the app and verify the switcher shows the new language and screens render in it.
