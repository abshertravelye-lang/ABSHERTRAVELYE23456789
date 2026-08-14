---
name: Drizzle-Zod Zod v3 compatibility
description: drizzle-zod@0.8+ is incompatible with Zod v3; createInsertSchema return type breaks.
---
**Rule:** Keep `drizzle-zod` pinned to `^0.5.1` in lib/db/package.json.

**Why:** drizzle-zod@0.8+ was rewritten for Zod v4. The monorepo uses Zod v3 (zod@3.x). The `createInsertSchema` return type no longer satisfies `ZodType<any,any,any>` with v3, causing cascading type errors in every consumer.

**How to apply:** If anyone upgrades drizzle-zod, also upgrade zod to v4 — or revert drizzle-zod. Do not mix v4 drizzle-zod with v3 zod.
