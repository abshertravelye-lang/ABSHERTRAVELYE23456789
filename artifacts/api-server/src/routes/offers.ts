import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListOffersQueryParams,
  CreateOfferBody,
  GetOfferParams,
  UpdateOfferParams,
  UpdateOfferBody,
  DeleteOfferParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/offers", async (req, res) => {
  try {
    const query = ListOffersQueryParams.parse(req.query);
    let rows = await db.select().from(offersTable).orderBy(offersTable.createdAt);
    if (query.featured !== undefined) {
      rows = rows.filter((r) => r.featured === query.featured);
    }
    if (query.limit) {
      rows = rows.slice(0, query.limit);
    }
    const result = rows.map((r) => ({
      ...r,
      price: Number(r.price),
      createdAt: r.createdAt.toISOString(),
    }));
    res.json(result);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/offers", async (req, res) => {
  try {
    const body = CreateOfferBody.parse(req.body);
    const [row] = await db.insert(offersTable).values(body).returning();
    res.status(201).json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
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
    res.json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/offers/:id", async (req, res) => {
  try {
    const { id } = UpdateOfferParams.parse({ id: Number(req.params.id) });
    const body = UpdateOfferBody.parse(req.body);
    const [row] = await db.update(offersTable).set(body).where(eq(offersTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ ...row, price: Number(row.price), createdAt: row.createdAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/offers/:id", async (req, res) => {
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
