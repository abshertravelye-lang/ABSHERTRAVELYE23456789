import { Router } from "express";
import { db } from "@workspace/db";
import { programsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListProgramsQueryParams,
  CreateProgramBody,
  GetProgramParams,
  UpdateProgramParams,
  UpdateProgramBody,
  DeleteProgramParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/programs", async (req, res) => {
  try {
    const query = ListProgramsQueryParams.parse(req.query);
    let rows = await db.select().from(programsTable).orderBy(programsTable.createdAt);
    if (query.featured !== undefined) {
      rows = rows.filter((r) => r.featured === query.featured);
    }
    res.json(rows.map((r) => ({ ...r, price: Number(r.price), createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/programs", async (req, res) => {
  try {
    const body = CreateProgramBody.parse(req.body);
    const [row] = await db.insert(programsTable).values(body).returning();
    res.status(201).json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const { id } = GetProgramParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(programsTable).where(eq(programsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/programs/:id", async (req, res) => {
  try {
    const { id } = UpdateProgramParams.parse({ id: Number(req.params.id) });
    const body = UpdateProgramBody.parse(req.body);
    const [row] = await db.update(programsTable).set(body).where(eq(programsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/programs/:id", async (req, res) => {
  try {
    const { id } = DeleteProgramParams.parse({ id: Number(req.params.id) });
    await db.delete(programsTable).where(eq(programsTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
