import { Router } from "express";
import { db } from "@workspace/db";
import { notificationPreferencesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

const updatePrefsSchema = z.object({
  notifyBooking: z.boolean().optional(),
  notifyVisa:    z.boolean().optional(),
  notifyPromo:   z.boolean().optional(),
  notifySystem:  z.boolean().optional(),
  pushEnabled:   z.boolean().optional(),
});

const toResponse = (row: typeof notificationPreferencesTable.$inferSelect) => ({
  notifyBooking: row.notifyBooking,
  notifyVisa:    row.notifyVisa,
  notifyPromo:   row.notifyPromo,
  notifySystem:  row.notifySystem,
  pushEnabled:   row.pushEnabled,
  updatedAt:     row.updatedAt.toISOString(),
});

/** Default preferences object (all enabled) */
const DEFAULT_PREFS = {
  notifyBooking: true,
  notifyVisa:    true,
  notifyPromo:   true,
  notifySystem:  true,
  pushEnabled:   true,
  updatedAt:     new Date().toISOString(),
};

// GET /notification-preferences — return the authenticated user's preferences
router.get("/notification-preferences", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, req.user!.sub))
      .limit(1);

    // Return defaults if no row yet (row is created lazily on first PUT)
    res.json(row ? toResponse(row) : DEFAULT_PREFS);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /notification-preferences — upsert preferences for the authenticated user
router.put("/notification-preferences", requireAuth, async (req, res) => {
  try {
    const updates = updatePrefsSchema.parse(req.body);

    const [row] = await db
      .insert(notificationPreferencesTable)
      .values({ userId: req.user!.sub, ...updates })
      .onConflictDoUpdate({
        target: notificationPreferencesTable.userId,
        set: { ...updates, updatedAt: new Date() },
      })
      .returning();

    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
