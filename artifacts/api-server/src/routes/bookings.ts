import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListBookingsQueryParams,
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
} from "@workspace/api-zod";

const router = Router();

const formatBooking = (r: typeof bookingsTable.$inferSelect) => ({
  ...r,
  totalPrice: r.totalPrice ? Number(r.totalPrice) : null,
  createdAt: r.createdAt.toISOString(),
});

router.get("/bookings", async (req, res) => {
  try {
    const query = ListBookingsQueryParams.parse(req.query);
    let rows = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);
    if (query.type) rows = rows.filter((r) => r.type === query.type);
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    res.json(rows.map(formatBooking));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const body = CreateBookingBody.parse(req.body);
    const [row] = await db.insert(bookingsTable).values(body).returning();
    res.status(201).json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/bookings/:id", async (req, res) => {
  try {
    const { id } = GetBookingParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bookings/:id", async (req, res) => {
  try {
    const { id } = UpdateBookingParams.parse({ id: Number(req.params.id) });
    const body = UpdateBookingBody.parse(req.body);
    const [row] = await db.update(bookingsTable).set(body).where(eq(bookingsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
