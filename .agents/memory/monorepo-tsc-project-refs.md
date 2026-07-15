---
name: Monorepo tsc project references pitfall
description: tsc can report "no exported member" for symbols that genuinely exist in a lib package's src — caused by stale dist declarations in TS project references, not bad code.
---

In this pnpm workspace, `lib/*` packages export `.` to `./src/index.ts` (source, not `dist`) in `package.json`, but root/app `tsconfig.json` files also list them under `"references"`. Each lib's own `tsconfig.json` needs `"composite": true` plus `declarationMap`/`emitDeclarationOnly` to be a valid reference target — a lib missing `composite` throws `TS6306`.

**Why:** Even though `exports` points at `src`, a project-referenced lib's stale `dist/*.d.ts` (compiled before your latest schema/hook change) can cause `tsc` to report `has no exported member 'X'` for a member that is present in `src` — very confusing, looks like a resolution bug but isn't. This project's `pnpm -w run typecheck:libs` is separately broken (pre-existing drizzle-zod/zod version mismatch, unrelated, do not try to fix it as a side effect of this).

**How to apply:** If tsc claims a freshly-added export doesn't exist in a `@workspace/*` lib package: (1) delete stray `.tsbuildinfo` files (`find . -name "*.tsbuildinfo" -not -path "*/node_modules/*"`), (2) run `npx tsc -b tsconfig.json --force` at the repo root to rebuild dist declarations for lib packages — it's fine if it errors out later on the (pre-existing, broken) `lib/db` build; earlier packages in the graph (e.g. `api-client-react`) still get their `dist/*.d.ts` refreshed before the failure. Re-run your app's `tsc --noEmit` afterward to confirm.
