import { Router } from "express";
import { db } from "@workspace/db";
import { visasTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
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
});

router.get("/visas", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(visasTable)
      .where(isNull(visasTable.deletedAt))
      .orderBy(visasTable.countryEn);
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/visas", async (req, res) => {
  try {
    const body = CreateVisaBody.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (typeof data.fee === "number") data.fee = String(data.fee);
    const [row] = await db.insert(visasTable).values(data as never).returning();
    res.status(201).json(toResponse(row));
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

router.patch("/visas/:id", async (req, res) => {
  try {
    const { id } = UpdateVisaParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaBody.parse(req.body);
    const data: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof data.fee === "number") data.fee = String(data.fee);
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

router.delete("/visas/:id", async (req, res) => {
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
