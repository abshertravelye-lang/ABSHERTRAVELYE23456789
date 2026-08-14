---
name: Auth token refresh across apps
description: 15-min access tokens require the shared 401-refresh-retry mechanism; pitfalls found
---

Access tokens expire in 15 min; refresh tokens rotate (7d). The shared API client (`customFetch`) supports `setAuthRefreshHandler` — on 401 it refreshes once (deduplicated) and retries. Web (`use-auth.tsx`) and mobile (`AuthContext.tsx`) both register a handler.

**Why:** without it, any long-lived page silently starts failing with 401s — and one such 401 was misreported to the user as "photo rejected".

**How to apply:**
- New clients that store bearer tokens MUST register both `setAuthTokenGetter` and `setAuthRefreshHandler`.
- The 401 retry only fires when the client itself attached the token and the body is a replayable string — never overwrite caller-provided Authorization headers (token-leak risk to third-party origins).
- Refresh tokens must include a unique `jti`: same payload + same second produces identical JWTs, colliding with the sessions-table token-hash unique constraint (500 on /auth/refresh).
- UI rule: an HTTP/service error from an AI-check endpoint is NOT a rejection — server returns 503 for outages vs 200 `valid:false` for genuine rejections; frontends must keep the two distinct.
