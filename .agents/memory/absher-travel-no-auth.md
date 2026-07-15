---
name: Absher Travel no-auth posture
description: The absher-travel app (booking, contact, visa applications) has no authentication anywhere — a deliberate, pre-existing product posture to match, not a gap to silently fix.
---

`artifacts/absher-travel` has no auth on any public flow (booking form, contact form, and now the visa-application wizard + its object-storage upload endpoint are all unauthenticated by design, matching the rest of the app).

**Why:** Adding auth to only one new feature while the rest of the app has none would be inconsistent and add friction the product doesn't otherwise have. This was a deliberate tradeoff, not an oversight.

**How to apply:** When adding new public-facing submission flows to this app, default to no-auth to match existing conventions — but always flag the tradeoff explicitly to the user in your summary (e.g. "the upload endpoint is intentionally public, like the rest of the app") rather than silently deciding it's fine.
