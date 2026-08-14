import { Router } from "express";
import crypto from "node:crypto";
import { db } from "@workspace/db";
import {
  supportConversationsTable,
  supportMessagesTable,
  usersTable,
} from "@workspace/db";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { notifyUser } from "../lib/notify";

const router = Router();

// Support chat is customer-support functionality, so it is gated behind the
// existing "messages" staff permission (the support_employee role preset
// already grants it). Chosen over 'customers'/'settings' as the closest fit.
const SUPPORT_PERMISSION = "messages" as const;

const MAX_BODY_LEN = 2000;
const GUEST_RATE_WINDOW_MS = 60_000;
const GUEST_RATE_MAX = 20; // messages per conversation per minute

// Simple in-memory rate limiter for guest message posts.
const guestRateBuckets = new Map<string, number[]>();
function guestRateLimited(conversationId: string): boolean {
  const now = Date.now();
  const times = (guestRateBuckets.get(conversationId) ?? []).filter(
    (t) => now - t < GUEST_RATE_WINDOW_MS,
  );
  if (times.length >= GUEST_RATE_MAX) {
    guestRateBuckets.set(conversationId, times);
    return true;
  }
  times.push(now);
  guestRateBuckets.set(conversationId, times);
  return false;
}

const bodySchema = z.object({
  body: z.string().trim().min(1).max(MAX_BODY_LEN),
});

type ConversationRow = typeof supportConversationsTable.$inferSelect;
type MessageRow = typeof supportMessagesTable.$inferSelect;

const formatConversation = (c: ConversationRow) => ({
  id: c.id,
  userId: c.userId,
  guestName: c.guestName,
  status: c.status,
  lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
  customerUnreadCount: c.customerUnreadCount,
  staffUnreadCount: c.staffUnreadCount,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

const formatMessage = (m: MessageRow) => ({
  id: m.id,
  conversationId: m.conversationId,
  sender: m.sender,
  senderUserId: m.senderUserId,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
});

// Resolve the `after` filter (ISO timestamp or message id) to a created_at cutoff.
async function resolveAfter(conversationId: string, after?: string): Promise<Date | null> {
  if (!after) return null;
  const asDate = new Date(after);
  if (!Number.isNaN(asDate.getTime())) return asDate;
  // Treat as a message id.
  const [msg] = await db
    .select({ createdAt: supportMessagesTable.createdAt })
    .from(supportMessagesTable)
    .where(
      and(eq(supportMessagesTable.id, after), eq(supportMessagesTable.conversationId, conversationId)),
    );
  return msg ? msg.createdAt : null;
}

async function loadMessages(conversationId: string, after?: string) {
  const cutoff = await resolveAfter(conversationId, after);
  const conditions = [eq(supportMessagesTable.conversationId, conversationId)];
  if (cutoff) conditions.push(gt(supportMessagesTable.createdAt, cutoff));
  return db
    .select()
    .from(supportMessagesTable)
    .where(and(...conditions))
    .orderBy(asc(supportMessagesTable.createdAt));
}

// ── Customer (authenticated) ────────────────────────────────────────────────

// Find the caller's single open conversation, if any.
async function findOpenConversation(userId: string) {
  const [conv] = await db
    .select()
    .from(supportConversationsTable)
    .where(
      and(
        eq(supportConversationsTable.userId, userId),
        eq(supportConversationsTable.status, "open"),
      ),
    )
    .orderBy(desc(supportConversationsTable.lastMessageAt))
    .limit(1);
  return conv ?? null;
}

/**
 * Get-or-create the caller's single OPEN conversation. The DB enforces at most
 * one open conversation per user via the partial unique index
 * `support_conversations_one_open_per_user`; if a concurrent request wins the
 * insert race we get a 23505 unique violation and simply re-fetch the winner.
 */
async function getOrCreateOpenConversation(userId: string) {
  const existing = await findOpenConversation(userId);
  if (existing) return existing;
  try {
    const [created] = await db
      .insert(supportConversationsTable)
      .values({ userId, status: "open" })
      .returning();
    return created;
  } catch (e) {
    if (e && typeof e === "object" && (e as { code?: string }).code === "23505") {
      const winner = await findOpenConversation(userId);
      if (winner) return winner;
    }
    throw e;
  }
}

// Get-or-create the caller's single open conversation.
router.post("/support/conversation", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const existing = await findOpenConversation(userId);
    if (existing) return res.json(formatConversation(existing));

    const created = await getOrCreateOpenConversation(userId);
    res.status(201).json(formatConversation(created));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/support/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const after = typeof req.query.after === "string" ? req.query.after : undefined;
    const conv = await findOpenConversation(userId);
    if (!conv) return res.json([]);

    const rows = await loadMessages(conv.id, after);
    // Reset AFTER fetching messages (reset races are acceptable).
    await db
      .update(supportConversationsTable)
      .set({ customerUnreadCount: 0, updatedAt: new Date() })
      .where(eq(supportConversationsTable.id, conv.id));
    res.json(rows.map(formatMessage));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/support/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { body } = bodySchema.parse(req.body);

    const conv = await getOrCreateOpenConversation(userId);

    const [msg] = await db
      .insert(supportMessagesTable)
      .values({ conversationId: conv.id, sender: "customer", senderUserId: userId, body })
      .returning();

    // Atomic DB-side increment avoids lost updates under concurrency.
    await db
      .update(supportConversationsTable)
      .set({
        lastMessageAt: msg.createdAt,
        staffUnreadCount: sql`${supportConversationsTable.staffUnreadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(supportConversationsTable.id, conv.id));

    res.status(201).json(formatMessage(msg));
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Guest (unauthenticated) ───────────────────────────────────────────────

const guestNameSchema = z.object({ name: z.string().trim().min(1).max(120) });

router.post("/support/guest/conversation", async (req, res) => {
  try {
    const { name } = guestNameSchema.parse(req.body);
    const guestToken = crypto.randomBytes(24).toString("hex"); // 48 chars
    const [created] = await db
      .insert(supportConversationsTable)
      .values({ guestName: name, guestToken, status: "open" })
      .returning();
    res.status(201).json({ conversationId: created.id, guestToken });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Extract the guest token, preferring the 'x-guest-token' header over the
// (backward-compatible) query param / body field.
function extractGuestToken(req: import("express").Request, fromQuery?: string): string | undefined {
  const header = req.headers["x-guest-token"];
  const headerToken = Array.isArray(header) ? header[0] : header;
  if (typeof headerToken === "string" && headerToken.length > 0) return headerToken;
  return fromQuery && fromQuery.length > 0 ? fromQuery : undefined;
}

// A guest token only resolves a conversation while it is UNCLAIMED
// (user_id IS NULL). Once claimed the token is nulled, so it is dead.
async function findGuestConversation(token: string | undefined) {
  if (!token) return null;
  const [conv] = await db
    .select()
    .from(supportConversationsTable)
    .where(
      and(
        eq(supportConversationsTable.guestToken, token),
        isNull(supportConversationsTable.userId),
      ),
    )
    .limit(1);
  return conv ?? null;
}

router.get("/support/guest/messages", async (req, res) => {
  try {
    const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
    const token = extractGuestToken(req, queryToken);
    const after = typeof req.query.after === "string" ? req.query.after : undefined;
    const conv = await findGuestConversation(token);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const rows = await loadMessages(conv.id, after);
    // Reset AFTER fetching messages (reset races are acceptable).
    await db
      .update(supportConversationsTable)
      .set({ customerUnreadCount: 0, updatedAt: new Date() })
      .where(eq(supportConversationsTable.id, conv.id));
    res.json(rows.map(formatMessage));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

const guestPostSchema = z.object({
  // Backward-compat: token may arrive in the body; the 'x-guest-token' header
  // is preferred when present.
  token: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(MAX_BODY_LEN),
});

router.post("/support/guest/messages", async (req, res) => {
  try {
    const parsed = guestPostSchema.parse(req.body);
    const token = extractGuestToken(req, parsed.token);
    const conv = await findGuestConversation(token);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    if (guestRateLimited(conv.id)) {
      return res.status(429).json({ error: "Too many messages, please slow down" });
    }

    const [msg] = await db
      .insert(supportMessagesTable)
      .values({
        conversationId: conv.id,
        sender: "customer",
        senderUserId: null,
        body: parsed.body,
      })
      .returning();

    // Atomic DB-side increment avoids lost updates under concurrency.
    await db
      .update(supportConversationsTable)
      .set({
        lastMessageAt: msg.createdAt,
        staffUnreadCount: sql`${supportConversationsTable.staffUnreadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(supportConversationsTable.id, conv.id));

    res.status(201).json(formatMessage(msg));
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Link a guest conversation to the calling account (preserves history).
const claimSchema = z.object({ token: z.string().min(1).optional() });
router.post("/support/guest/claim", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = claimSchema.parse(req.body);
    const token = extractGuestToken(req, parsed.token);
    if (!token) return res.status(400).json({ error: "Missing guest token" });

    // Atomic, one-time claim: only succeeds while the conversation is still an
    // unclaimed guest conversation (user_id IS NULL). The guest_token is nulled
    // so it can never be replayed. This prevents claim races and ownership
    // overwrites without a read-then-write window.
    let updated: ConversationRow | undefined;
    try {
      [updated] = await db
        .update(supportConversationsTable)
        .set({ userId, guestToken: null, updatedAt: new Date() })
        .where(
          and(
            eq(supportConversationsTable.guestToken, token),
            isNull(supportConversationsTable.userId),
          ),
        )
        .returning();
    } catch (err) {
      // The partial unique index enforces at most one OPEN conversation per
      // user; if the caller already has one, the claim conflicts.
      if (err && typeof err === "object" && (err as { code?: string }).code === "23505") {
        return res
          .status(409)
          .json({ error: "You already have an open conversation; close it before claiming another" });
      }
      throw err;
    }

    if (updated) return res.json(formatConversation(updated));

    // Nothing updated: either the token is unknown/expired (404) or it was
    // already claimed (by this or another account) → 409.
    const [existing] = await db
      .select({ id: supportConversationsTable.id, userId: supportConversationsTable.userId })
      .from(supportConversationsTable)
      .where(eq(supportConversationsTable.guestToken, token))
      .limit(1);
    if (!existing) {
      return res.status(409).json({ error: "Conversation already claimed or token invalid" });
    }
    return res.status(409).json({ error: "Conversation already linked to an account" });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Staff / admin dashboard ──────────────────────────────────────────────

router.get(
  "/support/admin/conversations",
  requireAuth,
  requirePermission(SUPPORT_PERMISSION),
  async (req, res) => {
    try {
      const rows = await db
        .select({
          conversation: supportConversationsTable,
          userEmail: usersTable.email,
          userPhone: usersTable.phone,
          userFirstName: usersTable.firstName,
          userLastName: usersTable.lastName,
        })
        .from(supportConversationsTable)
        .leftJoin(usersTable, eq(supportConversationsTable.userId, usersTable.id))
        .orderBy(desc(supportConversationsTable.lastMessageAt), desc(supportConversationsTable.createdAt));

      const convIds = rows.map((r) => r.conversation.id);
      // Last message preview per conversation.
      const previews = new Map<string, { body: string; createdAt: string }>();
      if (convIds.length > 0) {
        const msgs = await db
          .select()
          .from(supportMessagesTable)
          .orderBy(desc(supportMessagesTable.createdAt));
        for (const m of msgs) {
          if (!previews.has(m.conversationId)) {
            previews.set(m.conversationId, {
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            });
          }
        }
      }

      const result = rows.map((r) => {
        const c = r.conversation;
        const fullName = [r.userFirstName, r.userLastName].filter(Boolean).join(" ").trim();
        const customerName = c.userId ? fullName || r.userEmail || "Customer" : c.guestName || "Guest";
        const preview = previews.get(c.id) ?? null;
        return {
          ...formatConversation(c),
          customerName,
          userEmail: r.userEmail ?? null,
          userPhone: r.userPhone ?? null,
          isGuest: !c.userId,
          lastMessagePreview: preview ? preview.body.slice(0, 140) : null,
          lastMessageSenderAt: preview ? preview.createdAt : null,
        };
      });
      res.json(result);
    } catch (e) {
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.get(
  "/support/admin/conversations/:id/messages",
  requireAuth,
  requirePermission(SUPPORT_PERMISSION),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const [conv] = await db
        .select()
        .from(supportConversationsTable)
        .where(eq(supportConversationsTable.id, id));
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      const rows = await loadMessages(conv.id);
      // Reset AFTER fetching messages (reset races are acceptable).
      await db
        .update(supportConversationsTable)
        .set({ staffUnreadCount: 0, updatedAt: new Date() })
        .where(eq(supportConversationsTable.id, conv.id));
      res.json(rows.map(formatMessage));
    } catch (e) {
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

router.post(
  "/support/admin/conversations/:id/reply",
  requireAuth,
  requirePermission(SUPPORT_PERMISSION),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { body } = bodySchema.parse(req.body);
      const [conv] = await db
        .select()
        .from(supportConversationsTable)
        .where(eq(supportConversationsTable.id, id));
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      const [msg] = await db
        .insert(supportMessagesTable)
        .values({
          conversationId: conv.id,
          sender: "staff",
          senderUserId: req.user!.sub,
          body,
        })
        .returning();

      // Atomic DB-side increment avoids lost updates under concurrency.
      await db
        .update(supportConversationsTable)
        .set({
          lastMessageAt: msg.createdAt,
          customerUnreadCount: sql`${supportConversationsTable.customerUnreadCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(supportConversationsTable.id, conv.id));

      // Deliver in-app + real push to the linked customer (spec section 5).
      if (conv.userId) {
        const preview = body.slice(0, 140);
        void notifyUser({
          userId: conv.userId,
          titleAr: "رسالة جديدة من فريق الدعم",
          titleEn: "New message from our Support Team",
          messageAr: preview,
          messageEn: preview,
          relatedEntityType: "support_conversation",
          relatedEntityId: conv.id,
          url: "/support-chat",
        });
      }

      res.status(201).json(formatMessage(msg));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

const statusSchema = z.object({ status: z.enum(["open", "closed"]) });
router.patch(
  "/support/admin/conversations/:id",
  requireAuth,
  requirePermission(SUPPORT_PERMISSION),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { status } = statusSchema.parse(req.body);
      const [updated] = await db
        .update(supportConversationsTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(supportConversationsTable.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Conversation not found" });
      res.json(formatConversation(updated));
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
