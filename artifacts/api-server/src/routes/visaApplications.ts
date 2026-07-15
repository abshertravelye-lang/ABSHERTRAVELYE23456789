import { Router } from "express";
import { db } from "@workspace/db";
import { visaApplicationSubmissionsTable, visasTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  CreateVisaApplicationBody,
  ListVisaApplicationsQueryParams,
  GetVisaApplicationParams,
  UpdateVisaApplicationParams,
  UpdateVisaApplicationBody,
} from "@workspace/api-zod";

const router = Router();

const toResponse = (r: typeof visaApplicationSubmissionsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// Normalizes a nationality string for case/whitespace-insensitive comparison
// against the free-text allow/block lists configured per-visa in the admin panel.
const normalize = (s: string) => s.trim().toLocaleLowerCase();

router.get("/visa-applications", async (req, res) => {
  try {
    const query = ListVisaApplicationsQueryParams.parse(req.query);
    const conditions = [];
    if (query.visaId) conditions.push(eq(visaApplicationSubmissionsTable.visaId, query.visaId));
    if (query.status) conditions.push(eq(visaApplicationSubmissionsTable.status, query.status));
    const rows = await db
      .select()
      .from(visaApplicationSubmissionsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visaApplicationSubmissionsTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/visa-applications", async (req, res) => {
  try {
    const body = CreateVisaApplicationBody.parse(req.body);

    const [visa] = await db
      .select()
      .from(visasTable)
      .where(and(eq(visasTable.id, body.visaId), isNull(visasTable.deletedAt)));
    if (!visa) return res.status(404).json({ error: "Visa not found" });

    // Server-side eligibility re-check (defense in depth — the client wizard
    // already gates the flow, but the same per-visa rules must hold here).
    if (body.eligibilityPath === "gcc" && !visa.acceptsGccResidency) {
      return res.status(422).json({ error: "GCC residency path is not accepted for this visa" });
    }
    if (body.eligibilityPath === "alternative") {
      const region = body.alternativeRegion;
      const regionAccepted =
        (region === "schengen" && visa.acceptsSchengenResidency) ||
        (region === "uk" && visa.acceptsUkResidency) ||
        (region === "usa" && visa.acceptsUsVisa) ||
        (region === "canada" && visa.acceptsCanadaResidency) ||
        (region === "australia" && visa.acceptsAustraliaResidency);
      if (!regionAccepted) {
        return res.status(422).json({ error: "Selected residency/visa region is not accepted for this visa" });
      }
    }
    if (body.eligibilityPath === "direct") {
      const nationality = normalize(body.nationality);
      const blocked = visa.blockedNationalities.some((n) => normalize(n) === nationality);
      const allowedList = visa.allowedNationalities;
      const allowed = allowedList.length === 0 || allowedList.some((n) => normalize(n) === nationality);
      if (blocked || !allowed) {
        const message = req.headers["x-lang"] === "en"
          ? (visa.ineligibleMessageEn || "Sorry, you are not eligible to apply for this visa.")
          : (visa.ineligibleMessageAr || "عذراً، لا يمكنك التقديم على هذه التأشيرة وفق الشروط المحددة.");
        return res.status(422).json({ error: message });
      }
    }

    const data: Record<string, unknown> = { ...body };
    const [row] = await db.insert(visaApplicationSubmissionsTable).values(data as never).returning();
    res.status(201).json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/visa-applications/:id", async (req, res) => {
  try {
    const { id } = GetVisaApplicationParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(visaApplicationSubmissionsTable).where(eq(visaApplicationSubmissionsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/visa-applications/:id", async (req, res) => {
  try {
    const { id } = UpdateVisaApplicationParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaApplicationBody.parse(req.body);
    const [row] = await db
      .update(visaApplicationSubmissionsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(visaApplicationSubmissionsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
