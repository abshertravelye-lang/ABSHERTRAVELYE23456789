import { Router } from "express";
import { db } from "@workspace/db";
import { programsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import {
  ListProgramsQueryParams,
  CreateProgramBody,
  GetProgramParams,
  UpdateProgramParams,
  UpdateProgramBody,
  DeleteProgramParams,
} from "@workspace/api-zod";

const router = Router();

const toResponse = (r: typeof programsTable.$inferSelect) => ({
  ...r,
  price: Number(r.price),
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
  cities: r.cities ?? [],
  images: r.images ?? [],
  airlines: r.airlines ?? [],
  includedServices: r.includedServices ?? [],
  excludedServices: r.excludedServices ?? [],
  dailyItinerary: r.dailyItinerary ?? [],
  hotels: r.hotels ?? [],
});

router.get("/programs", async (req, res) => {
  try {
    const query = ListProgramsQueryParams.parse(req.query);
    let rows = await db
      .select()
      .from(programsTable)
      .where(isNull(programsTable.deletedAt))
      .orderBy(programsTable.createdAt);
    if (query.featured !== undefined) {
      rows = rows.filter((r) => r.featured === query.featured);
    }
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/programs", async (req, res) => {
  try {
    const body = CreateProgramBody.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (typeof data.price === "number") data.price = String(data.price);
    const [row] = await db.insert(programsTable).values(data as never).returning();
    res.status(201).json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const { id } = GetProgramParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select()
      .from(programsTable)
      .where(and(eq(programsTable.id, id), isNull(programsTable.deletedAt)));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/programs/:id", async (req, res) => {
  try {
    const { id } = UpdateProgramParams.parse({ id: Number(req.params.id) });
    const body = UpdateProgramBody.parse(req.body);
    const data: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof data.price === "number") data.price = String(data.price);
    const [row] = await db
      .update(programsTable)
      .set(data as never)
      .where(and(eq(programsTable.id, id), isNull(programsTable.deletedAt)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/programs/:id", async (req, res) => {
  try {
    const { id } = DeleteProgramParams.parse({ id: Number(req.params.id) });
    await db
      .update(programsTable)
      .set({ deletedAt: new Date() })
      .where(eq(programsTable.id, id));
    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
