import { Router } from "express";
import { db } from "@workspace/db";
import { visasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateVisaBody,
  GetVisaParams,
  UpdateVisaParams,
  UpdateVisaBody,
  DeleteVisaParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/visas", async (req, res) => {
  try {
    const rows = await db.select().from(visasTable).orderBy(visasTable.countryEn);
    res.json(rows.map((r) => ({ ...r, fee: Number(r.fee), createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/visas", async (req, res) => {
  try {
    const body = CreateVisaBody.parse(req.body);
    const [row] = await db.insert(visasTable).values(body).returning();
    res.status(201).json({ ...row, fee: Number(row.fee), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/visas/:id", async (req, res) => {
  try {
    const { id } = GetVisaParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(visasTable).where(eq(visasTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, fee: Number(row.fee), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/visas/:id", async (req, res) => {
  try {
    const { id } = UpdateVisaParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaBody.parse(req.body);
    const [row] = await db.update(visasTable).set(body).where(eq(visasTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, fee: Number(row.fee), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/visas/:id", async (req, res) => {
  try {
    const { id } = DeleteVisaParams.parse({ id: Number(req.params.id) });
    await db.delete(visasTable).where(eq(visasTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
