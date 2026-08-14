import { Router } from "express";
import { requireAuth, requirePermission } from "../middleware/auth";
import { db } from "@workspace/db";
import {
  offersTable, destinationsTable, programsTable, visasTable, bookingsTable,
  contactMessagesTable, usersTable, visaApplicationSubmissionsTable, flightSearchesTable,
} from "@workspace/db";
import { GetRecentBookingsQueryParams } from "@workspace/api-zod";
import { sql, count, sum, eq } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", requireAuth, requirePermission("overview"), async (req, res) => {
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

    // ── Section 10: customer/visa/revenue stats ────────────────────────────
    const [customersResult] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "customer"));
    const [visaAppsResult] = await db.select({ count: count() }).from(visaApplicationSubmissionsTable);
    const [newVisaAppsResult] = await db
      .select({ count: count() })
      .from(visaApplicationSubmissionsTable)
      .where(sql`status = 'received'`);
    const [completedVisaAppsResult] = await db
      .select({ count: count() })
      .from(visaApplicationSubmissionsTable)
      .where(sql`status IN ('issued', 'completed')`);
    const [pendingVisaAppsResult] = await db
      .select({ count: count() })
      .from(visaApplicationSubmissionsTable)
      .where(sql`status NOT IN ('issued', 'completed', 'rejected')`);
    const [flightSearchesResult] = await db.select({ count: count() }).from(flightSearchesTable);
    const [revenueResult] = await db.select({ total: sum(bookingsTable.totalPrice) }).from(bookingsTable).where(sql`status = 'confirmed'`);

    const visaAppsByStatusRaw = await db
      .select({ status: visaApplicationSubmissionsTable.status, count: count() })
      .from(visaApplicationSubmissionsTable)
      .groupBy(visaApplicationSubmissionsTable.status);

    const [topCountryRaw] = await db
      .select({ countryAr: visasTable.countryAr, count: count() })
      .from(visaApplicationSubmissionsTable)
      .innerJoin(visasTable, eq(visaApplicationSubmissionsTable.visaId, visasTable.id))
      .groupBy(visasTable.countryAr)
      .orderBy(sql`count(*) DESC`)
      .limit(1);

    const [topNationalityRaw] = await db
      .select({ nationality: visaApplicationSubmissionsTable.nationality, count: count() })
      .from(visaApplicationSubmissionsTable)
      .groupBy(visaApplicationSubmissionsTable.nationality)
      .orderBy(sql`count(*) DESC`)
      .limit(1);

    const monthlyReportRaw = await db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        visaApplications: count(),
      })
      .from(visaApplicationSubmissionsTable)
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
      .orderBy(sql`to_char(created_at, 'YYYY-MM') DESC`)
      .limit(12);

    const monthlyBookingsRaw = await db
      .select({
        month: sql<string>`to_char(created_at, 'YYYY-MM')`,
        bookings: count(),
        revenue: sum(bookingsTable.totalPrice),
      })
      .from(bookingsTable)
      .groupBy(sql`to_char(created_at, 'YYYY-MM')`);
    const bookingsByMonth = new Map(monthlyBookingsRaw.map((r) => [r.month, r]));

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
      totalCustomers: Number(customersResult.count),
      totalVisaApplications: Number(visaAppsResult.count),
      newVisaApplications: Number(newVisaAppsResult.count),
      completedVisaApplications: Number(completedVisaAppsResult.count),
      pendingVisaApplications: Number(pendingVisaAppsResult.count),
      totalRevenue: Number(revenueResult.total ?? 0),
      totalFlightSearches: Number(flightSearchesResult.count),
      mostRequestedCountry: topCountryRaw?.countryAr ?? null,
      mostApplyingNationality: topNationalityRaw?.nationality ?? null,
      visaApplicationsByStatus: visaAppsByStatusRaw.map((r) => ({ status: r.status, count: Number(r.count) })),
      monthlyReport: monthlyReportRaw.map((r) => ({
        month: r.month,
        visaApplications: Number(r.visaApplications),
        bookings: Number(bookingsByMonth.get(r.month)?.bookings ?? 0),
        revenue: Number(bookingsByMonth.get(r.month)?.revenue ?? 0),
      })),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-bookings", requireAuth, requirePermission("overview"), async (req, res) => {
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
