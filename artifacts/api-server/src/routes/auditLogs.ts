import { Router } from "express";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

// GET /api/audit-logs — super_admin/admin or explicit audit_logs permission
router.get("/audit-logs", requireAuth, requirePermission("audit_logs"), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const rows = await db
      .select({
        id: auditLogsTable.id,
        action: auditLogsTable.action,
        entityType: auditLogsTable.entityType,
        entityId: auditLogsTable.entityId,
        newValue: auditLogsTable.newValue,
        ipAddress: auditLogsTable.ipAddress,
        createdAt: auditLogsTable.createdAt,
        userId: auditLogsTable.userId,
        userEmail: usersTable.email,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
        userRole: usersTable.role,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
