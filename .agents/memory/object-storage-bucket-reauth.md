---
name: Object storage bucket lost authorization
description: Sidecar 401 "no allowed resources" in the MAIN workspace means the bucket itself lost authorization; fix by re-provisioning a new bucket.
---

Symptom: every GCS operation (token exchange at 127.0.0.1:1106/token, signed-object-url) returns 401 "no allowed resources" — in the main workspace AND production, even though env vars match the bucket and `setupObjectStorage()` reports `alreadySetUp: true`.

**Why:** the bucket is no longer owned/authorized for this repl (e.g. after fork/remix or account changes). Env vars pointing at it don't grant access; adding `[objectStorage] defaultBucketID` to `.replit` doesn't repair it either.

**How to apply:**
1. Diagnose with a direct sidecar probe: `curl 127.0.0.1:1106/credential` → exchange at `/token`; 401 "no allowed resources" = bucket auth problem, not code.
2. Fix: remove the stale storage env vars from `.replit` `[userenv.shared]` AND any `[objectStorage]` section (via `verifyAndReplaceDotReplit`), then call `setupObjectStorage()` — with no bucket configured it provisions a fresh, correctly-authorized bucket.
3. Restart the API server, verify with an authenticated `POST /api/storage/uploads` + serve-back, then the user must REPUBLISH so production picks up the new bucket env vars.
4. Objects in the old bucket are unrecoverable from this repl; DB rows referencing old `/objects/...` paths will 404 (`object_uploads`, `users.profile_photo_url`, etc.).

Distinct from the isolated-task-env limitation (same 401 there is expected and dev falls back to `.local-uploads/`).
