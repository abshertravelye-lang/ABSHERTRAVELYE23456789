---
name: i18n coverage check
description: How mobile translation keys are validated against the shared dictionary, and the missing-key policy
---

# i18n coverage check

Rule: every literal `t('domain.key')` used in absher-mobile must exist in `@workspace/i18n` (lib/i18n/src). A static coverage script (`lib/i18n/scripts/check-coverage.mts`, run via `pnpm dlx tsx`) verifies (1) every dictionary entry has non-empty ar+en text, and (2) no mobile literal key is missing. Registered as validation commands `i18n-coverage` and `mobile-typecheck`.

**Why:** raw programming keys (e.g. `profileEdit.header`) reached users in production Arabic UI because screens referenced keys never added to the shared dictionary.

**How to apply:** when adding mobile screens with new `t()` keys, add them to a lib/i18n/src domain file first, then run the coverage validation. `translate()` now console.warns on unknown keys outside production. Note: some screens (umrah landing tab) keep a local `ui` dictionary — the coverage script skips keys resolved locally. lib/i18n is a pure-data package with no node/dom types — use `globalThis` casts, never `process`/`console` directly.
