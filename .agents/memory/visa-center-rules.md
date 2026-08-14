---
name: Visa Center production rules
description: Auth gate, profile completeness, eligibility, tracking format, Coming Soon pages — all production requirements for the Visa Center feature. Now includes Admin eligibility configuration.
---

## Core rules (do not break)

**Auth gate:** `POST /api/visa-applications` requires `requireAuth` (not `optionalAuth`). Any unauthenticated attempt returns 401.

**Profile completeness (backend enforced):** `isProfileComplete()` in `artifacts/api-server/src/routes/auth.ts` checks: firstName/lastName, nationality, dateOfBirth, gender, phone, profilePhotoUrl, passportNumber, passportExpiryDate, passportImageUrl. If isGccResident→gccResidenceCountry+gccResidenceFrontUrl. If isEuropeanResident→europeanDocumentUrl. Returns 422 with `profileIncomplete: true` if incomplete.

**Server-side eligibility:** The backend uses STORED profile for all eligibility checks — it never trusts client-sent nationality/residency. `checkEligibility()` in `visaApplications.ts` uses this EXACT priority:
1. `blockedNationalities` → BLOCK immediately (cannot be overridden by ANY document or residency)
2. `allowedNationalities` (if non-empty list) → must be in list or BLOCK
3. `gccResidencyRequirement === "required"` → must be GCC resident + country in `acceptedGccCountries` (empty = any GCC)
4. `europeanSchengenLogic` → "neither"|"european_only"|"schengen_only"|"either"|"both"
5. ELIGIBLE

**Tracking number format:** `AT-YYYY-NNNNNN` (e.g. `AT-2026-047832`). Old format `VISA-YYYY-######` is deprecated.

**Eligibility pre-check:** `GET /api/visa-applications/eligibility/:visaId` (requireAuth) — returns `{eligible, reason, profileIncomplete?}` before submission.

**Coming Soon:** Flights (`/flights`) and Hotels (`/hotels`) show styled Coming Soon pages — no flight search, no booking, no 404. Both web and mobile.

## DB schema additions (all migrated)

**users table:** `is_european_resident` (bool), `european_document_type` (text), `european_document_url` (text), `european_document_expiry` (date), `profile_completed_at` (timestamptz).

**visas table (new columns — all migrated via ALTER TABLE):**
- `gcc_residency_requirement` TEXT NOT NULL DEFAULT 'not_required'
- `accepted_gcc_countries` TEXT[] NOT NULL DEFAULT '{}'
- `european_schengen_logic` TEXT NOT NULL DEFAULT 'neither'
- `requires_european_doc` BOOLEAN NOT NULL DEFAULT FALSE
- `requires_schengen_doc` BOOLEAN NOT NULL DEFAULT FALSE

**Also exists in Drizzle schema (visas.ts) as:** `gccResidencyRequirement`, `acceptedGccCountries`, `europeanSchengenLogic`, `requiresEuropeanDoc`, `requiresSchengenDoc`

## Zod schemas (api-zod/src/generated/api.ts)

`CreateVisaBody` and `UpdateVisaBody` both accept the 5 new fields as optional. This allows them to pass through the server-side `.parse()` without being stripped.

## Admin form (visas-admin.tsx)

Organized into 4 sections:
- **A. Basic Info**: country, visa type/category/entry, fee, processing, durations, descriptions, **visa image upload** (file upload, preview, replace — NO URL field)
- **B. Eligibility**: allowed nationalities (searchable multi-select, ~200 countries), blocked nationalities (same, red section with "always wins" warning), GCC requirement radio + accepted GCC countries checkboxes, European/Schengen logic radio (neither/european_only/schengen_only/either/both), custom ineligible messages
- **C. Required Documents**: 6 checkboxes (passport, personal photo, GCC permit, European permit, Schengen visa, other)
- **D. Status**: active toggle

Country list is inlined (~200 countries) with Arabic and English names. Values stored as English names (to match OCR/eligibility normalization).

## Apply flow (web)
1. `visa-view.tsx` Apply button → calls `handleApply()` → checks auth, profile complete, then calls eligibility endpoint → navigates to `/visas/apply/:id`
2. `visa-apply.tsx` → auth gate at mount (redirect to login), profile completeness check, displays stored profile data (read-only), collects only custom fields + agreement → submits `{visaId, customFieldResponses, agreedToTerms}`
3. Backend loads everything else from stored profile — user never re-enters name/passport/residency

## GCC country dropdown
6 countries in order: Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman. Must be dropdown (Select), not free text.

## Passport OCR
When user uploads passport image in account.tsx profile, OCR auto-fills: passportNumber, nationality, dateOfBirth, passportIssueDate, passportExpiryDate, passportIssueCountry, gender, firstName/lastName (if empty).

**Why:** Single source of truth — profile data feeds into visa applications; OCR prevents mis-entry.

## Verified test scenarios
Visa configured: allowed=[Yemen, Egypt], blocked=[Iran], GCC required=[Saudi Arabia, UAE]
- Yemen + Saudi GCC → ✅ ALLOWED
- Iran + Saudi GCC (+ full profile) → ❌ BLOCKED (prohibited nationality wins over everything)
- Yemen + no GCC → ❌ BLOCKED (GCC required but missing)
