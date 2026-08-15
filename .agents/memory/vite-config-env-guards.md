---
name: Vite config env guards break production builds
description: PORT/BASE_PATH hard-required at vite.config load time crash `vite build`; default them instead.
---

Vite configs that `throw` when `PORT`/`BASE_PATH` are unset fail during `pnpm -r run build` and production publishes, because build commands run without the artifact workflow's injected env.

**Why:** Managed artifact workflows inject `PORT`/`BASE_PATH` only for dev serving. `[services.production.build]` and the root `pnpm run build` run bare, so a config-load-time guard kills every static build even though the values are irrelevant to `vite build` output (except `base`).

**How to apply:** In any artifact `vite.config.ts`, default `PORT` and `BASE_PATH` to the values from that artifact's `artifact.toml` (`services.env`) instead of throwing. Keep the guard only where the value is truly required at runtime (e.g. the API server reading `process.env.PORT` at startup).
