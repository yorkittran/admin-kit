---
description: Scaffold a new CRUD resource (schema → server module → web screen → i18n → nav/palette → audit) using the add-resource skill
argument-hint: <resource-name>
---

If "$ARGUMENTS" is empty, ask me for the resource name and stop.

Use the add-resource skill to add the resource "$ARGUMENTS" to this project. Follow the skill's recipe exactly and in order. When done, run the automatable checks from the skill's Verify section (`bun run check`, the audit-row query, the key-parity diff across all catalogs in `apps/web/messages/`), report their results, and list the manual UI checks left for me.
