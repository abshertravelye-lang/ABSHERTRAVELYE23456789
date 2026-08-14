import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { ListNotificationsQueryParams, MarkNotificationReadParams } from "@workspace/api-zod";
import { notifyManyUsers, notifyAllActiveUsers } from "../lib/notify";

const router = Router();

const sendNotificationSchema = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  messageAr: z.string().min(1),
  messageEn: z.string().min(1),
  audience: z.enum(["all", "users"]),
  userIds: z.array(z.string()).optional(),
  url: z.string().optional(),
});

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

// ── Admin: send a broadcast/targeted notification ──────────────────────────
router.post(
  "/notifications/send",
  requireAuth,
  requirePermission("notifications"),
  async (req, res) => {
    try {
      const body = sendNotificationSchema.parse(req.body);

      if (body.audience === "users" && (!body.userIds || body.userIds.length === 0)) {
        return res.status(400).json({ error: "userIds is required when audience is 'users'" });
      }

      const payload = {
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        messageAr: body.messageAr,
        messageEn: body.messageEn,
        url: body.url ?? null,
        sentBy: req.user!.sub,
      };

      const sentCount =
        body.audience === "all"
          ? await notifyAllActiveUsers(payload)
          : await notifyManyUsers(body.userIds!, payload);

      res.json({ sentCount });
    } catch (e) {
      req.log.error(e);
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ── Admin: recent admin-sent broadcasts ────────────────────────────────────
// Returns the latest 200 notification rows that were created via an admin
// broadcast (sent_by set); the UI groups them by (sentBy, createdAt, title).
router.get(
  "/notifications/admin/history",
  requireAuth,
  requirePermission("notifications"),
  async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(notificationsTable)
        .where(isNotNull(notificationsTable.sentBy))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(200);
      res.json(rows.map(toResponse));
    } catch (e) {
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
