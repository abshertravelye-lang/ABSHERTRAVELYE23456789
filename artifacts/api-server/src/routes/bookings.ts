import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListBookingsQueryParams,
  CreateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  UpdateBookingBody,
} from "@workspace/api-zod";
import { requireAuth, optionalAuth, requirePermission, hasStaffPermission } from "../middleware/auth";

const router = Router();

const formatBooking = (r: typeof bookingsTable.$inferSelect) => ({
  ...r,
  totalPrice: r.totalPrice ? Number(r.totalPrice) : null,
  createdAt: r.createdAt.toISOString(),
});

// GET /api/bookings/my — customer's own bookings (must be before /bookings/:id)
router.get("/bookings/my", requireAuth, async (req, res) => {
  try {
    const query = ListBookingsQueryParams.parse(req.query);
    let rows = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.userId, req.user!.sub))
      .orderBy(bookingsTable.createdAt);
    if (query.type) rows = rows.filter((r) => r.type === query.type);
    res.json(rows.map(formatBooking));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings", requireAuth, requirePermission("bookings"), async (req, res) => {
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

router.post("/bookings", optionalAuth, async (req, res) => {
  try {
    const body = CreateBookingBody.parse(req.body);
    // Attach userId if the request is authenticated
    const userId = (req as any).user?.sub ?? null;
    const [row] = await db.insert(bookingsTable).values({ ...body, userId } as any).returning();
    res.status(201).json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/bookings/:id", requireAuth, async (req, res) => {
  try {
    const { id } = GetBookingParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    // Owner or staff with the bookings permission only.
    if (row.userId !== req.user!.sub && !(await hasStaffPermission(req.user!.sub, "bookings"))) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    res.json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bookings/:id", requireAuth, requirePermission("bookings"), async (req, res) => {
  try {
    const { id } = UpdateBookingParams.parse({ id: Number(req.params.id) });
    const body = UpdateBookingBody.parse(req.body);
    const [row] = await db.update(bookingsTable).set(body as any).where(eq(bookingsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(formatBooking(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
