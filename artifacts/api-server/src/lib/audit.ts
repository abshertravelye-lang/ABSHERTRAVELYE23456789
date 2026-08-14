import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

/** Fire-and-forget audit log entry. Never throws. */
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
  db.insert(auditLogsTable)
    .values({
      userId: opts.userId ?? req.user?.sub ?? null,
      action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      oldValue: opts.oldValue ?? null,
      newValue: opts.newValue ?? null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
    })
    .catch((e) => req.log?.warn({ err: e }, "audit log write failed"));
}
