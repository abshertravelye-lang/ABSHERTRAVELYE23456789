import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { ListNotificationsQueryParams, MarkNotificationReadParams } from "@workspace/api-zod";

const router = Router();

const toResponse = (r: typeof notificationsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
});

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const query = ListNotificationsQueryParams.parse(req.query);
    const conditions = [eq(notificationsTable.userId, req.user!.sub)];
    if (query.unreadOnly) conditions.push(eq(notificationsTable.isRead, false));
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = MarkNotificationReadParams.parse({ id: req.params.id });
    const [row] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.sub)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.post("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.userId, req.user!.sub), eq(notificationsTable.isRead, false)))
      .returning();
    res.json({ updated: rows.length });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
