import { Router } from "express";
import { db, programBookingRequestsTable, programsTable, usersTable } from "@workspace/db";
import type { ProgramBookingHistoryEntry } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { canonicalCountryCode, getCountryByCode } from "@workspace/countries";
import {
  CreateProgramBookingBody,
  UpdateProgramBookingStatusBody,
  ListProgramBookingsAdminQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { hasStaffPermission } from "../middleware/auth";
import { requirePermission } from "../middleware/auth";
import { notifyUser } from "../lib/notify";

const router = Router();

// ── Status vocabulary ────────────────────────────────────────────────────────

type BookingStatus =
  | "draft" | "submitted" | "under_review" | "awaiting_availability"
  | "awaiting_payment" | "paid" | "confirmed" | "completed" | "rejected" | "cancelled";

/** Statuses a customer may still cancel from. */
const CUSTOMER_CANCELLABLE: BookingStatus[] = [
  "draft", "submitted", "under_review", "awaiting_availability", "awaiting_payment",
];

/** Bilingual notification copy per status (sent when staff changes the status). */
const STATUS_MESSAGES: Record<string, { titleAr: string; titleEn: string; messageAr: string; messageEn: string }> = {
  submitted: {
    titleAr: "تم استلام طلب الحجز", titleEn: "Booking request received",
    messageAr: "تم استلام طلب حجز البرنامج السياحي بنجاح. سيقوم فريق الحجوزات بمراجعته قريباً.",
    messageEn: "Your program booking request was received successfully. Our bookings team will review it shortly.",
  },
  under_review: {
    titleAr: "طلبك قيد المراجعة", titleEn: "Your request is under review",
    messageAr: "يقوم فريق الحجوزات الآن بمراجعة طلب حجز البرنامج الخاص بك.",
    messageEn: "Our bookings team is now reviewing your program booking request.",
  },
  awaiting_availability: {
    titleAr: "جارٍ التحقق من التوفر", titleEn: "Checking availability",
    messageAr: "نقوم حالياً بالتحقق من توفر الفندق والخدمات لبرنامجك.",
    messageEn: "We are checking hotel and service availability for your program.",
  },
  awaiting_payment: {
    titleAr: "طلبك جاهز للدفع", titleEn: "Ready for payment",
    messageAr: "تمت الموافقة على طلب الحجز وهو الآن بانتظار الدفع لإتمام التأكيد.",
    messageEn: "Your booking request was approved and is now awaiting payment to complete confirmation.",
  },
  paid: {
    titleAr: "تم استلام الدفعة", titleEn: "Payment received",
    messageAr: "تم استلام دفعتك بنجاح. جارٍ تأكيد الحجز.",
    messageEn: "Your payment was received successfully. Your booking is being confirmed.",
  },
  confirmed: {
    titleAr: "تم تأكيد الحجز 🎉", titleEn: "Booking confirmed 🎉",
    messageAr: "تهانينا! تم تأكيد حجز برنامجك السياحي رسمياً.",
    messageEn: "Congratulations! Your program booking has been officially confirmed.",
  },
  completed: {
    titleAr: "اكتمل الحجز", titleEn: "Booking completed",
    messageAr: "اكتملت عملية الحجز. نتمنى لك رحلة سعيدة!",
    messageEn: "Your booking process is complete. We wish you a wonderful trip!",
  },
  rejected: {
    titleAr: "تعذر تنفيذ الطلب", titleEn: "Request could not be fulfilled",
    messageAr: "نأسف، تعذر تنفيذ طلب الحجز. يرجى التواصل معنا لمزيد من التفاصيل.",
    messageEn: "We're sorry — your booking request could not be fulfilled. Please contact us for details.",
  },
  cancelled: {
    titleAr: "تم إلغاء الطلب", titleEn: "Request cancelled",
    messageAr: "تم إلغاء طلب حجز البرنامج.",
    messageEn: "Your program booking request has been cancelled.",
  },
};

const toResponse = (r: typeof programBookingRequestsTable.$inferSelect) => ({
  ...r,
  programPrice: Number(r.programPrice),
  statusHistory: r.statusHistory ?? [],
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/** Generate unique request number: TRV-YYYY-NNNNNN */
function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TRV-${year}-${rand}`;
}

// ── Customer: list my bookings ──────────────────────────────────────────────
router.get("/program-bookings", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(programBookingRequestsTable)
      .where(eq(programBookingRequestsTable.userId, req.user!.sub))
      .orderBy(desc(programBookingRequestsTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Customer: submit a booking request ──────────────────────────────────────
router.post("/program-bookings", requireAuth, async (req, res) => {
  try {
    const ar = req.headers["x-lang"] === "ar";
    const userId = req.user!.sub;
    const body = CreateProgramBookingBody.parse(req.body);

    // Load the program (must exist, be active and not soft-deleted)
    const [program] = await db
      .select()
      .from(programsTable)
      .where(and(eq(programsTable.id, body.programId), isNull(programsTable.deletedAt)));
    if (!program || !program.isActive) {
      return res.status(404).json({
        error: ar ? "البرنامج غير متاح حالياً." : "This program is not currently available.",
      });
    }

    // Nationality: resolve against the master country list — never free text
    const code = canonicalCountryCode(body.nationality);
    const country = code ? getCountryByCode(code) : undefined;
    if (!code || !country) {
      return res.status(422).json({
        error: ar
          ? "الجنسية المدخلة غير معروفة. يرجى اختيارها من القائمة."
          : "Unrecognized nationality. Please select it from the list.",
      });
    }

    // Travel date sanity: must parse and not be in the past
    const travel = new Date(`${body.travelDate}T00:00:00Z`);
    if (Number.isNaN(travel.getTime())) {
      return res.status(422).json({ error: ar ? "تاريخ السفر غير صالح." : "Invalid travel date." });
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (travel < today) {
      return res.status(422).json({
        error: ar ? "تاريخ السفر لا يمكن أن يكون في الماضي." : "Travel date cannot be in the past.",
      });
    }
    if (body.returnDate) {
      const ret = new Date(`${body.returnDate}T00:00:00Z`);
      if (Number.isNaN(ret.getTime()) || ret < travel) {
        return res.status(422).json({
          error: ar ? "تاريخ العودة يجب أن يكون بعد تاريخ السفر." : "Return date must be after the travel date.",
        });
      }
    }

    // Room type must be one of the program's configured options (when configured)
    if (body.roomType && (program.roomTypes ?? []).length > 0 && !(program.roomTypes ?? []).includes(body.roomType)) {
      return res.status(422).json({
        error: ar ? "نوع الغرفة المختار غير متاح لهذا البرنامج." : "The selected room type is not available for this program.",
      });
    }

    // Unique TRV number (retry on the rare collision)
    let requestNumber = generateRequestNumber();
    for (let i = 0; i < 5; i++) {
      const [existing] = await db
        .select({ id: programBookingRequestsTable.id })
        .from(programBookingRequestsTable)
        .where(eq(programBookingRequestsTable.requestNumber, requestNumber));
      if (!existing) break;
      requestNumber = generateRequestNumber();
    }

    const now = new Date().toISOString();
    const history: ProgramBookingHistoryEntry[] = [
      { status: "submitted", at: now, by: "customer" },
    ];

    const [row] = await db.insert(programBookingRequestsTable).values({
      requestNumber,
      userId,
      programId: program.id,
      programTitleAr: program.titleAr,
      programTitleEn: program.titleEn,
      programDestination: program.destination ?? program.country ?? null,
      programPrice: program.price,
      programCurrency: program.currency ?? "SAR",
      fullName: body.fullName.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      nationality: country.nameEn,
      nationalityCode: code,
      adults: body.adults,
      children: body.children ?? 0,
      infants: body.infants ?? 0,
      travelDate: body.travelDate,
      returnDate: body.returnDate ?? null,
      rooms: body.rooms,
      roomType: body.roomType ?? null,
      specialRequirements: body.specialRequirements ?? null,
      customerNotes: body.customerNotes ?? null,
      status: "submitted",
      statusHistory: history,
    } as never).returning();

    await notifyUser({
      userId,
      ...STATUS_MESSAGES.submitted,
      messageAr: `${STATUS_MESSAGES.submitted.messageAr} رقم الطلب: ${requestNumber}`,
      messageEn: `${STATUS_MESSAGES.submitted.messageEn} Request number: ${requestNumber}`,
      relatedEntityType: "program_booking",
      relatedEntityId: row.id,
    });

    res.status(201).json(toResponse(row));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: e });
    }
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get one booking (owner or staff with bookings permission) ───────────────
router.get("/program-bookings/:id", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(programBookingRequestsTable)
      .where(eq(programBookingRequestsTable.id, String(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (row.userId !== req.user!.sub && !(await hasStaffPermission(req.user!.sub, "bookings"))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Customer cancels their own request ──────────────────────────────────────
router.post("/program-bookings/:id/cancel", requireAuth, async (req, res) => {
  try {
    const ar = req.headers["x-lang"] === "ar";
    const [row] = await db
      .select()
      .from(programBookingRequestsTable)
      .where(eq(programBookingRequestsTable.id, String(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (row.userId !== req.user!.sub) return res.status(403).json({ error: "Forbidden" });
    if (!CUSTOMER_CANCELLABLE.includes(row.status as BookingStatus)) {
      return res.status(422).json({
        error: ar
          ? "لا يمكن إلغاء الطلب في حالته الحالية. يرجى التواصل معنا."
          : "This request can no longer be cancelled. Please contact us.",
      });
    }
    const history: ProgramBookingHistoryEntry[] = [
      ...(row.statusHistory ?? []),
      { status: "cancelled", at: new Date().toISOString(), by: "customer" },
    ];
    const [updated] = await db
      .update(programBookingRequestsTable)
      .set({ status: "cancelled", statusHistory: history, updatedAt: new Date() })
      .where(eq(programBookingRequestsTable.id, row.id))
      .returning();
    res.json(toResponse(updated));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: list all bookings ─────────────────────────────────────────────────
router.get("/admin/program-bookings", requireAuth, requirePermission("bookings"), async (req, res) => {
  try {
    const query = ListProgramBookingsAdminQueryParams.parse(req.query);
    let rows = await db
      .select()
      .from(programBookingRequestsTable)
      .orderBy(desc(programBookingRequestsTable.createdAt));
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: update status (records history + notifies customer) ──────────────
router.patch("/admin/program-bookings/:id/status", requireAuth, requirePermission("bookings"), async (req, res) => {
  try {
    const body = UpdateProgramBookingStatusBody.parse(req.body);
    const [row] = await db
      .select()
      .from(programBookingRequestsTable)
      .where(eq(programBookingRequestsTable.id, String(req.params.id)));
    if (!row) return res.status(404).json({ error: "Not found" });

    const history: ProgramBookingHistoryEntry[] = [
      ...(row.statusHistory ?? []),
      { status: body.status, at: new Date().toISOString(), note: body.note ?? null, by: "staff" },
    ];

    const [updated] = await db
      .update(programBookingRequestsTable)
      .set({
        status: body.status as never,
        statusHistory: history,
        ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(programBookingRequestsTable.id, row.id))
      .returning();

    // Notify the customer of the new status (skip no-op transitions)
    if (body.status !== row.status) {
      const msg = STATUS_MESSAGES[body.status];
      if (msg) {
        await notifyUser({
          userId: row.userId,
          titleAr: msg.titleAr,
          titleEn: msg.titleEn,
          messageAr: body.note ? `${msg.messageAr}\n${body.note}` : `${msg.messageAr} رقم الطلب: ${row.requestNumber}`,
          messageEn: body.note ? `${msg.messageEn}\n${body.note}` : `${msg.messageEn} Request number: ${row.requestNumber}`,
          relatedEntityType: "program_booking",
          relatedEntityId: row.id,
        });
      }
    } else if (body.note) {
      // Same status but a message for the customer — deliver it
      await notifyUser({
        userId: row.userId,
        titleAr: `رسالة بخصوص طلبك ${row.requestNumber}`,
        titleEn: `Message about your request ${row.requestNumber}`,
        messageAr: body.note,
        messageEn: body.note,
        relatedEntityType: "program_booking",
        relatedEntityId: row.id,
      });
    }

    res.json(toResponse(updated));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: e });
    }
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
