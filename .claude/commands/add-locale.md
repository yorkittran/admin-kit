---
description: Add a new UI locale (copy en catalog, register locale, wire switcher)
argument-hint: <locale-code e.g. ja>
---

If "$1" is empty, ask me for the locale code and stop.

Add the locale "$1" to the web app:

1. Add "$1" to the `locales` array in `apps/web/project.inlang/settings.json`.
2. Copy `apps/web/messages/en.json` to `apps/web/messages/$1.json` and translate every message value to $1 (keep keys and `{param}` placeholders identical; leave `$schema` as is).
3. Run `bun --cwd=apps/web run paraglide:compile` — must exit cleanly. The compiler does NOT warn about missing messages (it silently falls back to en), so also verify key parity: the key sets of `messages/en.json` and `messages/$1.json` must be identical.
4. Add a `"$1": "<language's own name>"` entry to the `labels` record in `apps/web/src/components/locale-switcher.tsx`. (The options themselves derive automatically from the paraglide runtime `locales` — do not add a SelectItem.)
5. Run `bun run check`, then start the app and verify the switcher shows the new language and screens render in it.
