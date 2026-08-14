---
name: Storage object URL conventions
description: How stored object paths must be displayed and secured across web/admin/mobile
---

Stored file references are internal paths like `/objects/uploads/<uuid>`, served only via `GET /api/storage/objects/*`.

**Rule:** every surface that displays a stored image/document must rewrite `/objects/...` → `${BASE}/api/storage/objects/...` (web uses `import.meta.env.BASE_URL`, mobile uses `EXPO_PUBLIC_DOMAIN`). Rendering the raw path 404s and shows a broken image.

**Why:** the raw path is not routed anywhere; only the API storage route resolves it (GCS first, then `.local-uploads/` fallback in dev).

**How to apply:** any new page/component displaying `profilePhotoUrl`, `passportImageUrl`, or document URLs must use a display-URL helper with the `/objects/` branch. Also: AI endpoints that consume images (`/ocr`, `/validate-photo`) accept ONLY `/objects/uploads/<uuid>` paths (SSRF guard), require auth, and must fail closed — never report success when the underlying operation failed.

## Secured object access (Aug 2026)
- GET /api/storage/objects/* now requires auth, fail-closed. Ownership is table-backed (`object_uploads`, populated at authenticated upload) — never inferred from caller-writable rows (spoofable).
- Session JWTs are NOT accepted in query strings. Where headers are impossible (<a download>, PDF iframe), use path-scoped HMAC signed URLs: authed GET /api/storage/sign?path=... → ?exp=&sig= (10-min TTL, HMAC-SHA256 with SESSION_SECRET).
- Clients render private objects via Authorization-header blob fetch (web) or RN Image `{uri, headers}` (mobile); profile/custom-field writes reject /objects/ paths not owned by the writer; OCR endpoints enforce the same object authorization.
