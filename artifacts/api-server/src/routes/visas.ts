import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { db } from "@workspace/db";
import { visasTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { notifyAllActiveUsers } from "../lib/notify";
import { canonicalCountryEn } from "@workspace/countries";
import {
  CreateVisaBody,
  GetVisaParams,
  UpdateVisaParams,
  UpdateVisaBody,
  DeleteVisaParams,
} from "@workspace/api-zod";

const router = Router();

const toResponse = (r: typeof visasTable.$inferSelect) => ({
  ...r,
  fee: Number(r.fee),
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
  allowedNationalities: r.allowedNationalities ?? [],
  blockedNationalities: r.blockedNationalities ?? [],
  gccResidencyRequirement: (r as unknown as Record<string, unknown>).gccResidencyRequirement ?? "not_required",
  acceptedGccCountries: (r as unknown as Record<string, unknown>).acceptedGccCountries ?? [],
  europeanSchengenLogic: (r as unknown as Record<string, unknown>).europeanSchengenLogic ?? "neither",
  requiresEuropeanDoc: (r as unknown as Record<string, unknown>).requiresEuropeanDoc ?? false,
  requiresSchengenDoc: (r as unknown as Record<string, unknown>).requiresSchengenDoc ?? false,
});

/**
 * Broadcast an in-app notification to every active user AND fire a real push
 * to each of their registered devices (in each user's preferred language).
 * Fire-and-forget: never throws into the caller.
 */
async function notifyAllUsers(
  log: { error: (e: unknown) => void },
  titleAr: string,
  titleEn: string,
  messageAr: string,
  messageEn: string,
  relatedEntityType: string,
  relatedEntityId: string,
) {
  try {
    await notifyAllActiveUsers({
      titleAr,
      titleEn,
      messageAr,
      messageEn,
      relatedEntityType,
      relatedEntityId,
    });
  } catch (e) {
    log.error(e);
  }
}

router.get("/visas", async (req, res) => {
  try {
    const { countryId } = req.query;
    const conditions = [isNull(visasTable.deletedAt)];
    if (countryId) conditions.push(eq(visasTable.countryId, Number(countryId)));
    const rows = await db
      .select()
      .from(visasTable)
      .where(and(...conditions))
      .orderBy(visasTable.countryEn);
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Canonicalize country-list fields to canonical English names before persisting,
 *  so the eligibility engine's exact-match comparison stays consistent even for
 *  non-web/API clients. Unrecognized values are kept as-is (never silently dropped). */
function canonicalizeCountryLists(data: Record<string, unknown>) {
  for (const key of ["allowedNationalities", "blockedNationalities", "acceptedGccCountries"]) {
    if (Array.isArray(data[key])) {
      data[key] = (data[key] as string[]).map((v) => canonicalCountryEn(v) ?? v);
    }
  }
}

router.post("/visas", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const body = CreateVisaBody.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (typeof data.fee === "number") data.fee = String(data.fee);
    canonicalizeCountryLists(data);
    const [row] = await db.insert(visasTable).values(data as never).returning();
    res.status(201).json(toResponse(row));

    // Fire-and-forget: notify all active users about the new visa type
    const country = row.countryAr || row.countryEn || "جديدة";
    notifyAllUsers(
      req.log,
      `تأشيرة جديدة متاحة — ${row.countryAr || row.countryEn}`,
      `New visa available — ${row.countryEn || row.countryAr}`,
      `تم إضافة تأشيرة ${country} إلى منصة ABSHER TRAVEL. استكشف التفاصيل والمتطلبات الآن.`,
      `A new visa for ${row.countryEn || row.countryAr} has been added to ABSHER TRAVEL. Explore the details and requirements now.`,
      "visa",
      String(row.id),
    );
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/visas/:id", async (req, res) => {
  try {
    const { id } = GetVisaParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select()
      .from(visasTable)
      .where(and(eq(visasTable.id, id), isNull(visasTable.deletedAt)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/visas/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = UpdateVisaParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaBody.parse(req.body);
    const data: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof data.fee === "number") data.fee = String(data.fee);
    canonicalizeCountryLists(data);
    const [row] = await db
      .update(visasTable)
      .set(data as never)
      .where(and(eq(visasTable.id, id), isNull(visasTable.deletedAt)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/visas/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = DeleteVisaParams.parse({ id: Number(req.params.id) });
    await db
      .update(visasTable)
      .set({ deletedAt: new Date() })
      .where(eq(visasTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
