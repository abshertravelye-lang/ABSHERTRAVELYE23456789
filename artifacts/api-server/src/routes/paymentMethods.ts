import { Router } from "express";
import {
  db,
  paymentMethodsTable,
  walletsTable,
  walletTransactionsTable,
  appSettingsTable,
} from "@workspace/db";
import { asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";

const router = Router();

// ── Wallet enabled flag (app_settings key) ──────────────────────────────────
const WALLET_ENABLED_KEY = "wallet_enabled";

export async function isWalletEnabled(): Promise<boolean> {
  const [row] = await db.select().from(appSettingsTable)
    .where(eq(appSettingsTable.key, WALLET_ENABLED_KEY));
  // Default: enabled (feature exists today in the mobile app).
  return row ? row.value === "true" : true;
}

// ── Serializers ─────────────────────────────────────────────────────────────
const toMethodResponse = (m: typeof paymentMethodsTable.$inferSelect) => ({
  id: m.id,
  nameAr: m.nameAr,
  nameEn: m.nameEn,
  descriptionAr: m.descriptionAr,
  descriptionEn: m.descriptionEn,
  logoUrl: m.logoUrl,
  feePercent: Number(m.feePercent),
  feeFixed: Number(m.feeFixed),
  isActive: m.isActive,
  sortOrder: m.sortOrder,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
});

// ═════════════════════════════════════════════════════════════════════════
// PUBLIC — read-only config consumed by the web + mobile apps.
// ═════════════════════════════════════════════════════════════════════════

// GET /payment-config — wallet flag + ACTIVE payment methods sorted for display.
router.get("/payment-config", async (req, res) => {
  try {
    const [walletEnabled, methods] = await Promise.all([
      isWalletEnabled(),
      db.select().from(paymentMethodsTable)
        .where(eq(paymentMethodsTable.isActive, true))
        .orderBy(asc(paymentMethodsTable.sortOrder), asc(paymentMethodsTable.id)),
    ]);
    res.json({
      walletEnabled,
      paymentMethods: methods.map(toMethodResponse),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════
// USER WALLET — authenticated customer wallet (balance + transactions).
// ═════════════════════════════════════════════════════════════════════════

/** Get or lazily create the caller's wallet. */
async function getOrCreateWallet(userId: string) {
  const [existing] = await db.select().from(walletsTable)
    .where(eq(walletsTable.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(walletsTable)
    .values({ userId } as any)
    .onConflictDoNothing({ target: walletsTable.userId })
    .returning();
  if (created) return created;
  // Lost a race — the row now exists.
  const [row] = await db.select().from(walletsTable)
    .where(eq(walletsTable.userId, userId));
  return row;
}

// GET /wallet — caller's wallet: enabled flag, balance, currency, transactions.
router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const enabled = await isWalletEnabled();
    if (!enabled) {
      // Feature disabled from the dashboard — clients must hide the wallet.
      return res.json({ enabled: false, balance: 0, currency: "SAR", transactions: [] });
    }
    const wallet = await getOrCreateWallet(req.user!.sub);
    const txs = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.walletId, wallet.id))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(50);
    res.json({
      enabled: true,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      transactions: txs.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        titleAr: t.titleAr,
        titleEn: t.titleEn,
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════
// ADMIN — payment-method CRUD + reorder + wallet feature toggle.
// Guarded by the "payments" permission.
// ═════════════════════════════════════════════════════════════════════════

const methodBodySchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  feePercent: z.number().min(0).max(100).optional(),
  feeFixed: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// GET /admin/payment-methods — ALL methods (incl. inactive), sorted.
router.get("/admin/payment-methods", requireAuth, requirePermission("payments"), async (req, res) => {
  try {
    const methods = await db.select().from(paymentMethodsTable)
      .orderBy(asc(paymentMethodsTable.sortOrder), asc(paymentMethodsTable.id));
    res.json(methods.map(toMethodResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/payment-methods — create.
router.post("/admin/payment-methods", requireAuth, requirePermission("payments"), async (req, res) => {
  try {
    const body = methodBodySchema.parse(req.body);
    // New methods go to the end by default.
    let sortOrder = body.sortOrder;
    if (sortOrder === undefined) {
      const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${paymentMethodsTable.sortOrder}), -1)` })
        .from(paymentMethodsTable);
      sortOrder = Number(max) + 1;
    }
    const [row] = await db.insert(paymentMethodsTable).values({
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      descriptionAr: body.descriptionAr ?? null,
      descriptionEn: body.descriptionEn ?? null,
      logoUrl: body.logoUrl ?? null,
      feePercent: String(body.feePercent ?? 0),
      feeFixed: String(body.feeFixed ?? 0),
      isActive: body.isActive ?? true,
      sortOrder,
    } as any).returning();
    // audit_logs.entity_id is a UUID column; payment method ids are integers,
    // so the id goes into the JSON payload instead.
    logAudit(req, "payment_method.created", { entityType: "payment_method", newValue: { id: row.id, ...body } });
    res.status(201).json(toMethodResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/payment-methods/reorder — bulk reorder: [{id, sortOrder}, ...]
// NOTE: registered BEFORE /:id so "reorder" is not parsed as an id.
const reorderSchema = z.object({
  order: z.array(z.object({ id: z.number().int(), sortOrder: z.number().int() })).min(1),
});
router.put("/admin/payment-methods/reorder", requireAuth, requirePermission("payments"), async (req, res) => {
  try {
    const { order } = reorderSchema.parse(req.body);
    for (const { id, sortOrder } of order) {
      await db.update(paymentMethodsTable)
        .set({ sortOrder, updatedAt: sql`now()` } as any)
        .where(eq(paymentMethodsTable.id, id));
    }
    logAudit(req, "payment_method.reordered", { entityType: "payment_method", newValue: order });
    const methods = await db.select().from(paymentMethodsTable)
      .orderBy(asc(paymentMethodsTable.sortOrder), asc(paymentMethodsTable.id));
    res.json(methods.map(toMethodResponse));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/payment-methods/:id — update (partial).
router.put("/admin/payment-methods/:id", requireAuth, requirePermission("payments"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const body = methodBodySchema.partial().parse(req.body);
    const set: Record<string, unknown> = { updatedAt: sql`now()` };
    if (body.nameAr !== undefined) set.nameAr = body.nameAr;
    if (body.nameEn !== undefined) set.nameEn = body.nameEn;
    if (body.descriptionAr !== undefined) set.descriptionAr = body.descriptionAr;
    if (body.descriptionEn !== undefined) set.descriptionEn = body.descriptionEn;
    if (body.logoUrl !== undefined) set.logoUrl = body.logoUrl;
    if (body.feePercent !== undefined) set.feePercent = String(body.feePercent);
    if (body.feeFixed !== undefined) set.feeFixed = String(body.feeFixed);
    if (body.isActive !== undefined) set.isActive = body.isActive;
    if (body.sortOrder !== undefined) set.sortOrder = body.sortOrder;
    const [row] = await db.update(paymentMethodsTable)
      .set(set as any)
      .where(eq(paymentMethodsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Payment method not found" });
    logAudit(req, "payment_method.updated", { entityType: "payment_method", newValue: { id, ...body } });
    res.json(toMethodResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/payment-methods/:id
router.delete("/admin/payment-methods/:id", requireAuth, requirePermission("payments"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });
    const [row] = await db.delete(paymentMethodsTable)
      .where(eq(paymentMethodsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Payment method not found" });
    logAudit(req, "payment_method.deleted", { entityType: "payment_method", oldValue: toMethodResponse(row) });
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Wallet feature toggle ───────────────────────────────────────────────────
// Lives in the dashboard Settings page → guarded by the "settings" permission.

// GET /admin/wallet-settings
router.get("/admin/wallet-settings", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    res.json({ walletEnabled: await isWalletEnabled() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/wallet-settings — { walletEnabled: boolean }
router.put("/admin/wallet-settings", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    const { walletEnabled } = z.object({ walletEnabled: z.boolean() }).parse(req.body);
    const value = walletEnabled ? "true" : "false";
    await db.insert(appSettingsTable)
      .values({ key: WALLET_ENABLED_KEY, value, updatedBy: req.user!.sub })
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: { value, updatedBy: req.user!.sub, updatedAt: sql`now()` },
      });
    logAudit(req, "settings.wallet_toggled", { entityType: "app_settings", newValue: { walletEnabled } });
    res.json({ walletEnabled });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
