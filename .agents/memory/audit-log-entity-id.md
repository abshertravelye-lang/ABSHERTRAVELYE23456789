---
name: Audit log entity_id is UUID-only
description: audit_logs.entity_id is a uuid column; non-UUID entity ids must go in the JSON payload
---

**Rule:** `audit_logs.entity_id` is a `uuid` column. Entities with integer/serial primary keys (e.g. payment methods) must NOT pass their id as `entityId` to `logAudit` — put the id inside `newValue`/`oldValue` JSON instead.

**Why:** Passing a stringified integer causes `invalid input syntax for type uuid` and the audit write silently fails (logAudit is fire-and-forget, only a WARN log appears).

**How to apply:** When adding audit logging for any table with a non-UUID primary key, put the id in the JSON payload rather than `entityId`. Watch server logs for "audit log write failed" after adding new audited routes.
