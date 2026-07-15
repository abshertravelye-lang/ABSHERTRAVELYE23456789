---
name: Visa schema naming collision
description: Absher Travel's visas/travelerProfiles schemas have a naming trap for a public visa-application-submission feature — read before touching either schema.
---

`lib/db/src/schema/travelerProfiles.ts` already defines an (unused-by-frontend but real, migrated) `visaApplicationsTable` → Postgres table `visa_applications`, tied to authenticated user profiles with a `draft` status enum. It is a different shape than a public, unauthenticated visa-application-wizard submission record.

**Why:** Reusing the name/table for a new public submissions feature silently corrupts or conflicts with existing data/columns, since Postgres already has a `visa_applications` table with a different schema.

**How to apply:** Any new visa-application-related table/enum in `lib/db/src/schema/visas.ts` (or elsewhere) must use a distinct name, e.g. `visaApplicationSubmissionsTable` / SQL `visa_application_submissions`, with its own enums (`visa_application_submission_eligibility_path`, `..._gender`, `..._status`). Keep the public API-facing type name generic (`VisaApplication` in the OpenAPI spec is fine) — only the internal DB/Drizzle identifiers need to avoid the collision.
