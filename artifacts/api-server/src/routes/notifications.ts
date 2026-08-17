import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { ListNotificationsQueryParams, MarkNotificationReadParams } from "@workspace/api-zod";
import { notifyManyUsers, notifyAllActiveUsers, notifyUsersByRole } from "../lib/notify";

const router = Router();

const sendNotificationSchema = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  messageAr: z.string().min(1),
  messageEn: z.string().min(1),
  audience: z.enum(["all", "users", "group"]),
  userIds: z.array(z.string()).optional(),
  /** Role groups for audience="group" (e.g. all customers, all agents). */
  roles: z.array(z.enum(["customer", "agent", "admin", "super_admin"])).optional(),
  url: z.string().optional(),
  /** Public image path uploaded via /storage/uploads/public (or absolute URL). */
  imageUrl: z.string().optional(),
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

// ── Unread count (for the app-icon badge and tab badge) ─────────────────────
router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select({ unread: count() })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.user!.sub), eq(notificationsTable.isRead, false)));
    res.json({ unread: Number(row?.unread ?? 0) });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete one of the caller's own notifications ────────────────────────────
router.delete("/notifications/:id", requireAuth, async (req, res) => {
  try {
    const { id } = MarkNotificationReadParams.parse({ id: req.params.id });
    const rows = await db
      .delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.sub)))
      .returning();
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ deleted: rows.length });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
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
      if (body.audience === "group" && (!body.roles || body.roles.length === 0)) {
        return res.status(400).json({ error: "roles is required when audience is 'group'" });
      }

      const payload = {
        titleAr: body.titleAr,
        titleEn: body.titleEn,
        messageAr: body.messageAr,
        messageEn: body.messageEn,
        url: body.url ?? null,
        imageUrl: body.imageUrl ?? null,
        sentBy: req.user!.sub,
      };

      const sentCount =
        body.audience === "all"
          ? await notifyAllActiveUsers(payload)
          : body.audience === "group"
            ? await notifyUsersByRole(body.roles!, payload)
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
