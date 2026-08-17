---
name: Admin API base-path pitfall
description: API is mounted at root /api/...; never prefix web/admin fetches with the artifact BASE_URL.
---

# Admin API base-path pitfall

The API server is mounted at the root `/api/...` path of the shared proxy — NOT under
each artifact's base path.

**Why:** Prefixing a fetch with the artifact's `BASE_URL` produces `/<artifact>/api/...`,
which 404s. This bug shipped once in a hand-written admin fetch even though the generated
client already used root-relative paths.

**How to apply:** Hand-written fetches in web artifacts must use root-relative `/api/...`
directly; reserve `BASE_URL` for artifact-internal assets/routes. API-returned image paths
are also root paths — display as-is, never re-prefix.
