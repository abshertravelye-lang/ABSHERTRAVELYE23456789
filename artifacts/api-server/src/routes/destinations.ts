import { Router } from "express";
import { db } from "@workspace/db";
import { destinationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateDestinationBody,
  GetDestinationParams,
  UpdateDestinationParams,
  UpdateDestinationBody,
  DeleteDestinationParams,
} from "@workspace/api-zod";

import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/destinations", async (req, res) => {
  try {
    const rows = await db.select().from(destinationsTable).orderBy(destinationsTable.createdAt);
    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/destinations", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const body = CreateDestinationBody.parse(req.body);
    const [row] = await db.insert(destinationsTable).values(body).returning();
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/destinations/:id", async (req, res) => {
  try {
    const { id } = GetDestinationParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(destinationsTable).where(eq(destinationsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/destinations/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = UpdateDestinationParams.parse({ id: Number(req.params.id) });
    const body = UpdateDestinationBody.parse(req.body);
    const [row] = await db.update(destinationsTable).set(body).where(eq(destinationsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/destinations/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = DeleteDestinationParams.parse({ id: Number(req.params.id) });
    await db.delete(destinationsTable).where(eq(destinationsTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
