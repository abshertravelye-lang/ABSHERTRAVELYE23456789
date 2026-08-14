---
name: Drizzle insert/update with Zod bodies needs as-any
description: Passing Zod-parsed objects directly to Drizzle .insert().values() or .update().set() fails type check for decimal/enum columns.
---
**Rule:** Cast Zod-parsed bodies to `any` when passing to Drizzle insert/update: `.values(body as any)` and `.set(body as any)`.

**Why:** Drizzle's generated column types for decimal columns expect `string | SQL | PgColumn` but Zod schemas parse decimals as `number`. TypeScript rejects `number` for decimal columns even though Drizzle accepts it at runtime. Similarly, enum columns need the exact union type, not `string`.

**How to apply:** Any route using `db.insert(table).values(zodParsedBody)` or `db.update(table).set(zodParsedBody)` should cast the body with `as any`.
