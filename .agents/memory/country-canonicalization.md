---
name: Country canonicalization
description: How country names are kept consistent across profile, admin visa config, and eligibility
---
All stored country fields (user nationality/GCC residence, visa allowed/blocked/accepted lists) must hold canonical English names from the shared countries lib, and comparisons must be exact-match on canonical values — never substring.
**Why:** profiles stored full names while admin config stored abbreviations ("UAE"), and substring matching made "Oman" match "Romania" — silently mis-approving/rejecting visa applicants.
**How to apply:** canonicalize on every server-side write path (registration, profile update, visa create/update), not just in the UI; keep unrecognized values as-is rather than dropping them. Any new country field or client must follow the same invariant.
