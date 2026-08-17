import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable } from "@workspace/db";
import { eq, and, or, isNull, lte, gte, asc } from "drizzle-orm";
import {
  ListOffersQueryParams,
  CreateOfferBody,
  GetOfferParams,
  UpdateOfferParams,
  UpdateOfferBody,
  DeleteOfferParams,
} from "@workspace/api-zod";

import { requireAuth, requirePermission } from "../middleware/auth";
import { notifyAllActiveUsers } from "../lib/notify";

const router = Router();

const toResponse = (r: typeof offersTable.$inferSelect) => ({
  ...r,
  price: r.price === null || r.price === undefined ? null : Number(r.price),
  startDate: r.startDate ? r.startDate.toISOString() : null,
  endDate: r.endDate ? r.endDate.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/**
 * GET /offers — PUBLIC.
 * Returns only currently-active offers (is_active AND within the optional
 * start/end window), ordered by sort_order then createdAt. Never returns
 * fake/demo data — an empty array when nothing is active. Powers the mobile
 * home-screen promotional carousel and the public web offer pages.
 */
router.get("/offers", async (req, res) => {
  try {
    const query = ListOffersQueryParams.parse(req.query);
    const now = new Date();
    const rows = await db
      .select()
      .from(offersTable)
      .where(
        and(
          eq(offersTable.isActive, true),
          or(isNull(offersTable.startDate), lte(offersTable.startDate, now)),
          or(isNull(offersTable.endDate), gte(offersTable.endDate, now)),
        ),
      )
      .orderBy(asc(offersTable.sortOrder), asc(offersTable.createdAt));
    let result = rows;
    if (query.featured !== undefined) {
      result = result.filter((r) => r.featured === query.featured);
    }
    if (query.limit) {
      result = result.slice(0, query.limit);
    }
    res.json(result.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /offers/admin/list — ADMIN.
 * Returns ALL offers (active and inactive, regardless of date window) for
 * management in the admin dashboard.
 */
router.get("/offers/admin/list", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(offersTable)
      .orderBy(asc(offersTable.sortOrder), asc(offersTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/offers", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const body = CreateOfferBody.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (typeof data.price === "number") data.price = String(data.price);
    if (typeof data.startDate === "string") data.startDate = new Date(data.startDate);
    if (typeof data.endDate === "string") data.endDate = new Date(data.endDate);
    const [row] = await db.insert(offersTable).values(data as any).returning();
    res.status(201).json(toResponse(row));

    // Fire-and-forget: notify all active users about the new offer — but only
    // when it is immediately visible (active and within its date window).
    const now = new Date();
    const visible =
      row.isActive &&
      (!row.startDate || row.startDate <= now) &&
      (!row.endDate || row.endDate >= now);
    if (visible) {
      const nameAr = row.titleAr || row.titleEn || "";
      const nameEn = row.titleEn || row.titleAr || "";
      void notifyAllActiveUsers({
        titleAr: "عرض جديد متاح 🎉",
        titleEn: "New offer available 🎉",
        messageAr: `تم إضافة عرض جديد: ${nameAr}. اكتشف التفاصيل الآن.`,
        messageEn: `A new offer has been added: ${nameEn}. Check it out now.`,
        relatedEntityType: "offer",
        relatedEntityId: String(row.id),
        imageUrl: row.imageUrl ?? null,
      });
    }
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const { id } = GetOfferParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(offersTable).where(eq(offersTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/offers/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = UpdateOfferParams.parse({ id: Number(req.params.id) });
    const body = UpdateOfferBody.parse(req.body);
    const data: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof data.price === "number") data.price = String(data.price);
    if (typeof data.startDate === "string") data.startDate = new Date(data.startDate);
    if (typeof data.endDate === "string") data.endDate = new Date(data.endDate);
    const [row] = await db.update(offersTable).set(data as any).where(eq(offersTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/offers/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = DeleteOfferParams.parse({ id: Number(req.params.id) });
    await db.delete(offersTable).where(eq(offersTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
