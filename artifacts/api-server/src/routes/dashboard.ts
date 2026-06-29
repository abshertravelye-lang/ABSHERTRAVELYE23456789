import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable, destinationsTable, programsTable, visasTable, bookingsTable, contactMessagesTable } from "@workspace/db";
import { GetRecentBookingsQueryParams } from "@workspace/api-zod";
import { sql, count } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [totalBookingsResult] = await db.select({ count: count() }).from(bookingsTable);
    const [pendingResult] = await db.select({ count: count() }).from(bookingsTable).where(sql`status = 'pending'`);
    const [confirmedResult] = await db.select({ count: count() }).from(bookingsTable).where(sql`status = 'confirmed'`);
    const [cancelledResult] = await db.select({ count: count() }).from(bookingsTable).where(sql`status = 'cancelled'`);
    const [offersResult] = await db.select({ count: count() }).from(offersTable);
    const [destinationsResult] = await db.select({ count: count() }).from(destinationsTable);
    const [programsResult] = await db.select({ count: count() }).from(programsTable);
    const [messagesResult] = await db.select({ count: count() }).from(contactMessagesTable);
    const [unreadResult] = await db.select({ count: count() }).from(contactMessagesTable).where(sql`read = false`);

    const bookingsByTypeRaw = await db
      .select({ type: bookingsTable.type, count: count() })
      .from(bookingsTable)
      .groupBy(bookingsTable.type);

    res.json({
      totalBookings: Number(totalBookingsResult.count),
      pendingBookings: Number(pendingResult.count),
      confirmedBookings: Number(confirmedResult.count),
      cancelledBookings: Number(cancelledResult.count),
      totalOffers: Number(offersResult.count),
      totalDestinations: Number(destinationsResult.count),
      totalPrograms: Number(programsResult.count),
      totalMessages: Number(messagesResult.count),
      unreadMessages: Number(unreadResult.count),
      bookingsByType: bookingsByTypeRaw.map((b) => ({ type: b.type, count: Number(b.count) })),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-bookings", async (req, res) => {
  try {
    const params = GetRecentBookingsQueryParams.parse(req.query);
    const limit = params.limit ?? 10;
    const rows = await db.select().from(bookingsTable).orderBy(sql`created_at DESC`).limit(limit);
    res.json(rows.map((r) => ({
      ...r,
      totalPrice: r.totalPrice ? Number(r.totalPrice) : null,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
