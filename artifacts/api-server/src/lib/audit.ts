import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fire-and-forget audit log entry. Never throws.
 *
 * audit_logs.entity_id is a uuid column; non-UUID entity ids (integer PKs)
 * are moved into the newValue JSON payload instead so the insert never fails.
 */
export function logAudit(
  req: Request,
  action: string,
  opts: {
    userId?: string | null;
    entityType?: string;
    entityId?: string;
    oldValue?: unknown;
    newValue?: unknown;
  } = {},
): void {
  const isUuid = opts.entityId != null && UUID_RE.test(opts.entityId);
  let newValue = opts.newValue ?? null;
  if (opts.entityId != null && !isUuid) {
    const base = typeof newValue === "object" && newValue !== null ? newValue : {};
    newValue = { ...(base as Record<string, unknown>), entityId: opts.entityId };
  }
  db.insert(auditLogsTable)
    .values({
      userId: opts.userId ?? req.user?.sub ?? null,
      action,
      entityType: opts.entityType,
      entityId: isUuid ? opts.entityId : null,
      oldValue: opts.oldValue ?? null,
      newValue,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    })
    .catch((e) => req.log?.warn({ err: e }, "audit log write failed"));
}
