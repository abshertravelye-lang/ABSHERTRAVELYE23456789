import { Router } from "express";
import { db } from "@workspace/db";
import { pushTokensTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]).optional(),
  deviceName: z.string().optional(),
});

const deleteSchema = z.object({
  token: z.string().min(1),
});

// ── Register / upsert a device push token ──────────────────────────────────
// On token conflict, reassign the token to the current account and refresh
// last_seen_at. This ensures a shared device that logs out and back in as a
// different user stops receiving the previous account's notifications.
router.post("/push-tokens", requireAuth, async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const now = new Date();
    const [row] = await db
      .insert(pushTokensTable)
      .values({
        userId: req.user!.sub,
        token: body.token,
        platform: body.platform ?? null,
        deviceName: body.deviceName ?? null,
        lastSeenAt: now,
      } as never)
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: {
          userId: req.user!.sub,
          platform: body.platform ?? null,
          deviceName: body.deviceName ?? null,
          lastSeenAt: now,
        },
      })
      .returning();
    res.status(201).json({
      id: row.id,
      token: row.token,
      platform: row.platform,
      deviceName: row.deviceName,
    });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Delete a device push token (logout) ─────────────────────────────────────
// Only deletes the token if it belongs to the calling user, so one account
// cannot unregister another account's device.
router.delete("/push-tokens", requireAuth, async (req, res) => {
  try {
    const body = deleteSchema.parse(req.body);
    const rows = await db
      .delete(pushTokensTable)
      .where(and(eq(pushTokensTable.token, body.token), eq(pushTokensTable.userId, req.user!.sub)))
      .returning();
    res.json({ deleted: rows.length });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
