import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth";
import { db } from "@workspace/db";
import { visaCountriesTable, visasTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router = Router();

const toResponse = (r: typeof visaCountriesTable.$inferSelect & { visaCount?: number }) => ({
  ...r,
  visaCount: r.visaCount ?? 0,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

router.get("/visa-countries", async (req, res) => {
  try {
    const { region, activeOnly } = req.query;
    const rows = await db.select().from(visaCountriesTable)
      .where(
        region
          ? eq(visaCountriesTable.region, region as "gulf" | "arab" | "asian" | "european" | "african" | "american")
          : undefined
      )
      .orderBy(visaCountriesTable.sortOrder, visaCountriesTable.nameEn);

    // Add visa count per country
    const visaCounts = await db
      .select({ countryId: visasTable.countryId, total: count() })
      .from(visasTable)
      .where(eq(visasTable.isActive, true))
      .groupBy(visasTable.countryId);

    const countMap = new Map(visaCounts.map((v) => [v.countryId, Number(v.total)]));

    let result = rows.map((r) => toResponse({ ...r, visaCount: countMap.get(r.id) ?? 0 }));
    if (activeOnly === "true") {
      result = result.filter((r) => r.isActive);
    }

    res.json(result);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/visa-countries", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { nameAr, nameEn, countryCode, region, imageUrl, flagEmoji, descriptionAr, descriptionEn, isActive, sortOrder } = req.body;
    if (!nameAr || !nameEn || !countryCode || !region) {
      return res.status(400).json({ error: "nameAr, nameEn, countryCode, region are required" });
    }
    const [row] = await db.insert(visaCountriesTable).values({
      nameAr, nameEn, countryCode, region, imageUrl, flagEmoji, descriptionAr, descriptionEn,
      isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
    }).returning();
    res.status(201).json(toResponse({ ...row, visaCount: 0 }));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/visa-countries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(visaCountriesTable).where(eq(visaCountriesTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });

    const [vc] = await db
      .select({ total: count() })
      .from(visasTable)
      .where(and(eq(visasTable.countryId, id), eq(visasTable.isActive, true)));

    res.json(toResponse({ ...row, visaCount: Number(vc?.total ?? 0) }));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/visa-countries/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nameAr, nameEn, countryCode, region, imageUrl, flagEmoji, descriptionAr, descriptionEn, isActive, sortOrder } = req.body;
    const [row] = await db.update(visaCountriesTable)
      .set({ nameAr, nameEn, countryCode, region, imageUrl, flagEmoji, descriptionAr, descriptionEn, isActive, sortOrder, updatedAt: new Date() })
      .where(eq(visaCountriesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse({ ...row, visaCount: 0 }));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/visa-countries/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(visaCountriesTable).where(eq(visaCountriesTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/visa-countries/:id/visas", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(visasTable)
      .where(and(eq(visasTable.countryId, id), eq(visasTable.isActive, true)))
      .orderBy(visasTable.visaType);
    res.json(rows.map((r) => ({
      ...r,
      fee: Number(r.fee),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      allowedNationalities: r.allowedNationalities ?? [],
      blockedNationalities: r.blockedNationalities ?? [],
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
