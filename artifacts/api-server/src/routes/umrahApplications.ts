import { Router } from "express";
import { db } from "@workspace/db";
import { umrahApplicationsTable, usersTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, requirePermission, hasStaffPermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { canonicalCountryEn } from "@workspace/countries";
import { findUnownedObjectPath, getObjectOwner } from "../lib/objectAccess";
import { notifyUser } from "../lib/notify";
import { getUmrahSettings, resolveUmrahFee } from "./settings";

const router = Router();

// Saudi mobile format: starts +966, then optional 5, then 8-9 digits.
const SAUDI_PHONE_RE = /^\+9665?\d{8,9}$/;

// ── Status notification copy (mirrors visaApplications STATUS_MESSAGES) ─────
const STATUS_MESSAGES: Record<string, { titleAr: string; titleEn: string; messageAr: string; messageEn: string }> = {
  submitted: {
    titleAr: "تم استلام طلب العمرة", titleEn: "Umrah application received",
    messageAr: "لقد استلمنا طلب تأشيرة العمرة الخاص بك وسيتم مراجعته قريباً.",
    messageEn: "We've received your Umrah visa application and will review it shortly.",
  },
  under_review: {
    titleAr: "طلب العمرة قيد المراجعة", titleEn: "Umrah application under review",
    messageAr: "فريقنا يقوم الآن بمراجعة تفاصيل طلب تأشيرة العمرة.",
    messageEn: "Our team is now reviewing the details of your Umrah visa application.",
  },
  processing: {
    titleAr: "طلب العمرة قيد المعالجة", titleEn: "Umrah application processing",
    messageAr: "يتم حالياً معالجة طلب تأشيرة العمرة الخاص بك.",
    messageEn: "Your Umrah visa application is currently being processed.",
  },
  approved: {
    titleAr: "تمت الموافقة على طلب العمرة", titleEn: "Umrah application approved",
    messageAr: "تهانينا! تمت الموافقة على طلب تأشيرة العمرة الخاص بك.",
    messageEn: "Congratulations! Your Umrah visa application has been approved.",
  },
  rejected: {
    titleAr: "تم رفض طلب العمرة", titleEn: "Umrah application rejected",
    messageAr: "نأسف لإعلامك بأن طلب تأشيرة العمرة لم يتم قبوله. يرجى التواصل معنا لمزيد من التفاصيل.",
    messageEn: "We're sorry to inform you that your Umrah visa application was not approved. Please contact us for details.",
  },
  completed: {
    titleAr: "تم إكمال طلب العمرة", titleEn: "Umrah application completed",
    messageAr: "تم إكمال طلب تأشيرة العمرة بنجاح. نتمنى لك رحلة مباركة.",
    messageEn: "Your Umrah visa application has been completed. We wish you a blessed journey.",
  },
};

const toResponse = (r: typeof umrahApplicationsTable.$inferSelect) => ({
  ...r,
  feeAmount: r.feeAmount === null ? null : Number(r.feeAmount),
  paidAt: r.paidAt ? r.paidAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/** Generate unique Umrah tracking number: UM-YYYY-NNNNNN */
function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `UM-${year}-${rand}`;
}

// ── Submit Umrah application ───────────────────────────────────────────────
router.post("/umrah-applications", requireAuth, async (req, res) => {
  try {
    const ar = req.headers["x-lang"] === "ar";
    const userId = req.user!.sub;
    const body = req.body ?? {};

    const bilingual = (a: string, e: string) => (ar ? a : e);

    // 1. Sponsor requirement — enforced SERVER-SIDE (never trust frontend).
    if (body.sponsorAvailable !== true) {
      return res.status(422).json({
        error: bilingual(
          "لا يمكنك التقديم لعدم وجود مستضيف في المملكة العربية السعودية",
          "You cannot apply because you do not have a host (sponsor) in the Kingdom of Saudi Arabia.",
        ),
      });
    }

    // 2. Sponsor residency image + Saudi phone required.
    if (typeof body.sponsorResidencyImageUrl !== "string" || !body.sponsorResidencyImageUrl.trim()) {
      return res.status(422).json({
        error: bilingual("صورة إقامة المستضيف مطلوبة.", "Sponsor residency image is required."),
      });
    }
    if (typeof body.sponsorPhone !== "string" || !SAUDI_PHONE_RE.test(body.sponsorPhone)) {
      return res.status(422).json({
        error: bilingual(
          "رقم جوال المستضيف غير صالح ويجب أن يبدأ بـ +966.",
          "The sponsor phone number is invalid and must start with +966.",
        ),
      });
    }

    // 3. Required applicant documents / contact.
    if (typeof body.passportImageUrl !== "string" || !body.passportImageUrl.trim()) {
      return res.status(422).json({ error: bilingual("صورة الجواز مطلوبة.", "Passport image is required.") });
    }
    if (typeof body.personalPhotoUrl !== "string" || !body.personalPhotoUrl.trim()) {
      return res.status(422).json({ error: bilingual("الصورة الشخصية مطلوبة.", "Personal photo is required.") });
    }
    if (typeof body.phone !== "string" || !body.phone.trim()) {
      return res.status(422).json({ error: bilingual("رقم جوال المعتمر مطلوب.", "Pilgrim phone number is required.") });
    }
    if (typeof body.emergencyPhone !== "string" || !body.emergencyPhone.trim()) {
      return res.status(422).json({ error: bilingual("رقم جوال الطوارئ مطلوب.", "Emergency phone number is required.") });
    }

    // 4. Declaration must be accepted.
    if (body.declarationAccepted !== true) {
      return res.status(422).json({
        error: bilingual(
          "يجب الموافقة على إقرار وتعهد تأشيرة العمرة.",
          "You must accept the Umrah visa declaration and undertaking.",
        ),
      });
    }

    // 5. Object ownership: every /objects/ path must be owned by the caller.
    const unowned = await findUnownedObjectPath(userId, [
      body.sponsorResidencyImageUrl,
      body.passportImageUrl,
      body.personalPhotoUrl,
    ]);
    if (unowned) {
      return res.status(403).json({
        error: bilingual("لا تملك أحد المستندات المرفقة.", "You do not own one of the referenced documents."),
      });
    }

    // 6. Duplicate prevention: reject if the user already has an application
    // that is unpaid OR still in an active status (not rejected/completed).
    const existing = await db.select({
      id: umrahApplicationsTable.id,
      paymentStatus: umrahApplicationsTable.paymentStatus,
      status: umrahApplicationsTable.status,
    }).from(umrahApplicationsTable)
      .where(eq(umrahApplicationsTable.userId, userId));
    const hasActive = existing.some(
      (a) => a.paymentStatus === "unpaid" || !["rejected", "completed"].includes(a.status),
    );
    if (hasActive) {
      return res.status(409).json({
        error: bilingual(
          "لديك بالفعل طلب تأشيرة عمرة قيد المعالجة. لا يمكنك تقديم طلب جديد الآن.",
          "You already have an Umrah visa application in progress. You cannot submit a new one right now.",
        ),
      });
    }

    // 7. Compute the fee server-side from settings by nationality.
    const nationality = canonicalCountryEn(body.nationality) ?? (typeof body.nationality === "string" ? body.nationality.trim() : null);
    const { fees } = await getUmrahSettings();
    const { amount, currency } = resolveUmrahFee(fees, nationality);

    // 8. Generate unique tracking number.
    let trackingNumber = generateTrackingNumber();
    let attempts = 0;
    while (attempts < 5) {
      const [dup] = await db.select({ id: umrahApplicationsTable.id })
        .from(umrahApplicationsTable)
        .where(eq(umrahApplicationsTable.trackingNumber, trackingNumber));
      if (!dup) break;
      trackingNumber = generateTrackingNumber();
      attempts++;
    }

    const gender = body.gender === "male" || body.gender === "female" ? body.gender : null;

    const insertData = {
      userId,
      trackingNumber,
      sponsorAvailable: true,
      sponsorResidencyImageUrl: body.sponsorResidencyImageUrl,
      sponsorPhone: body.sponsorPhone,
      passportImageUrl: body.passportImageUrl,
      personalPhotoUrl: body.personalPhotoUrl,
      fullName: typeof body.fullName === "string" ? body.fullName : null,
      passportNumber: typeof body.passportNumber === "string" ? body.passportNumber : null,
      nationality,
      dateOfBirth: typeof body.dateOfBirth === "string" ? body.dateOfBirth : null,
      gender,
      passportIssueDate: typeof body.passportIssueDate === "string" ? body.passportIssueDate : null,
      passportExpiryDate: typeof body.passportExpiryDate === "string" ? body.passportExpiryDate : null,
      phone: body.phone,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : null,
      emergencyPhone: body.emergencyPhone,
      feeAmount: String(amount),
      feeCurrency: currency,
      // Payment is required upfront — status becomes "submitted" ONLY after pay.
      paymentStatus: "unpaid" as const,
      status: "awaiting_payment" as const,
      declarationAccepted: true,
    };

    let row;
    try {
      [row] = await db.insert(umrahApplicationsTable).values(insertData as never).returning();
    } catch (insertErr: unknown) {
      // DB-level guard: the partial unique index
      // (umrah_applications_one_active_per_user) closes the race window between
      // the read-then-insert duplicate check above and this INSERT. A 23505
      // unique-violation here means a concurrent request already created an
      // active application — return the same bilingual 409.
      if (
        insertErr &&
        typeof insertErr === "object" &&
        "code" in insertErr &&
        (insertErr as { code?: string }).code === "23505"
      ) {
        return res.status(409).json({
          error: bilingual(
            "لديك بالفعل طلب تأشيرة عمرة قيد المعالجة. لا يمكنك تقديم طلب جديد الآن.",
            "You already have an Umrah visa application in progress. You cannot submit a new one right now.",
          ),
        });
      }
      throw insertErr;
    }

    logAudit(req, "umrah_application.created", { entityType: "umrah_application", newValue: { id: row.id } });

    res.status(201).json({
      id: row.id,
      trackingNumber: row.trackingNumber,
      feeAmount: row.feeAmount === null ? null : Number(row.feeAmount),
      feeCurrency: row.feeCurrency,
      paymentStatus: row.paymentStatus,
      status: row.status,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "An error occurred while processing your Umrah application. Please try again." });
  }
});

// ── Pay for an Umrah application (owner only) ───────────────────────────────
router.post("/umrah-applications/:id/pay", requireAuth, async (req, res) => {
  try {
    const ar = req.headers["x-lang"] === "ar";
    const bilingual = (a: string, e: string) => (ar ? a : e);
    const id = String(req.params.id);
    const userId = req.user!.sub;

    const [app] = await db.select().from(umrahApplicationsTable)
      .where(eq(umrahApplicationsTable.id, id));
    if (!app) return res.status(404).json({ error: bilingual("الطلب غير موجود.", "Application not found.") });
    if (app.userId !== userId) return res.status(403).json({ error: bilingual("غير مصرح.", "Forbidden.") });

    // Server-side verification: only pay when awaiting_payment + unpaid.
    if (app.status !== "awaiting_payment" || app.paymentStatus !== "unpaid") {
      return res.status(409).json({
        error: bilingual("لا يمكن الدفع لهذا الطلب.", "This application cannot be paid for."),
      });
    }

    // ── SIMULATED PAYMENT ────────────────────────────────────────────────
    // No external payment gateway exists in this repo yet, so this endpoint
    // ONLY records a simulated, server-verified payment. The "PAY-SIM-" prefix
    // marks the reference as simulated so it is never mistaken for a real
    // gateway transaction.
    //
    // TODO(payment-gateway): Replace this block with a real integration:
    //   1. Create/confirm a charge with the gateway using the stored
    //      feeAmount/feeCurrency (server-side amount — never trust the client).
    //   2. VERIFY the transaction succeeded via the gateway's authoritative
    //      source (synchronous confirm response AND/OR a signed webhook).
    //   3. Only then mark paymentStatus='paid' and store the real provider
    //      reference. The application must NEVER be marked paid based on any
    //      frontend-supplied flag.
    const paymentReference = `PAY-SIM-${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    const [row] = await db.update(umrahApplicationsTable)
      .set({
        paymentStatus: "paid",
        paymentReference,
        paidAt: now,
        status: "submitted",
        updatedAt: now,
      } as never)
      .where(and(
        eq(umrahApplicationsTable.id, id),
        eq(umrahApplicationsTable.status, "awaiting_payment"),
        eq(umrahApplicationsTable.paymentStatus, "unpaid"),
      ))
      .returning();

    if (!row) {
      // Lost a race — someone already transitioned the row.
      return res.status(409).json({
        error: bilingual("لا يمكن الدفع لهذا الطلب.", "This application cannot be paid for."),
      });
    }

    logAudit(req, "umrah_application.paid", { entityType: "umrah_application", newValue: { id: row.id, paymentReference } });

    await notifyUser({
      userId,
      titleAr: "تم تقديم طلب تأشيرة العمرة بنجاح",
      titleEn: "Umrah visa application submitted successfully",
      messageAr: `تم تقديم طلب تأشيرة العمرة بنجاح. رقم الطلب: ${row.trackingNumber}.`,
      messageEn: `Your Umrah visa application has been submitted successfully. Tracking number: ${row.trackingNumber}.`,
      relatedEntityType: "umrah_application",
      relatedEntityId: row.id,
    });

    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "An error occurred while processing the payment. Please try again." });
  }
});

// ── List caller's own applications ──────────────────────────────────────────
router.get("/umrah-applications", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(umrahApplicationsTable)
      .where(eq(umrahApplicationsTable.userId, req.user!.sub))
      .orderBy(desc(umrahApplicationsTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: list all applications with user info ─────────────────────────────
router.get("/umrah-applications/admin/list", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  try {
    const rows = await db.select({
      app: umrahApplicationsTable,
      userFirstName: usersTable.firstName,
      userLastName: usersTable.lastName,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
    })
      .from(umrahApplicationsTable)
      .leftJoin(usersTable, eq(umrahApplicationsTable.userId, usersTable.id))
      .orderBy(desc(umrahApplicationsTable.createdAt));
    res.json(rows.map((r) => ({
      ...toResponse(r.app),
      user: {
        firstName: r.userFirstName ?? null,
        lastName: r.userLastName ?? null,
        email: r.userEmail ?? null,
        phone: r.userPhone ?? null,
      },
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get one application (owner or visa staff) ───────────────────────────────
router.get("/umrah-applications/:id", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);
    const [row] = await db.select().from(umrahApplicationsTable)
      .where(eq(umrahApplicationsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (row.userId !== req.user!.sub && !(await hasStaffPermission(req.user!.sub, "visa_applications"))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: update status / notes / issued visa ──────────────────────────────
router.patch("/umrah-applications/:id", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body ?? {};

    const allowedStatuses = ["awaiting_payment", "submitted", "under_review", "processing", "approved", "rejected", "completed"];
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.status === "string") {
      if (!allowedStatuses.includes(body.status)) return res.status(400).json({ error: "Invalid status" });
      set.status = body.status;
    }
    if (typeof body.adminNotes === "string") set.adminNotes = body.adminNotes;
    if (typeof body.issuedVisaUrl === "string") {
      // Ownership guard: when issuedVisaUrl is an internal object path, it MUST
      // be owned by the caller (the staff member who uploaded it). Otherwise a
      // staff member could point issuedVisaUrl at an arbitrary private object
      // and leak it to the customer via callerOwnsIssuedVisa (which grants the
      // owning customer read access to whatever path is stored here).
      if (body.issuedVisaUrl.startsWith("/objects/")) {
        const owner = await getObjectOwner(body.issuedVisaUrl);
        if (owner !== req.user!.sub) {
          return res.status(422).json({ error: "issuedVisaUrl must reference an object you uploaded" });
        }
      }
      set.issuedVisaUrl = body.issuedVisaUrl;
    }

    const [prev] = await db.select().from(umrahApplicationsTable)
      .where(eq(umrahApplicationsTable.id, id));
    if (!prev) return res.status(404).json({ error: "Not found" });

    const [row] = await db.update(umrahApplicationsTable)
      .set(set as never)
      .where(eq(umrahApplicationsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    // 1. Status change → status-specific copy.
    const statusChanged = typeof body.status === "string" && body.status !== prev.status;
    if (statusChanged) {
      const copy = STATUS_MESSAGES[body.status as string];
      if (copy) {
        await notifyUser({
          userId: row.userId,
          ...copy,
          relatedEntityType: "umrah_application",
          relatedEntityId: row.id,
        });
      }
    }

    // 2. Admin note added/changed.
    const noteChanged =
      typeof body.adminNotes === "string" &&
      body.adminNotes.trim().length > 0 &&
      body.adminNotes !== (prev.adminNotes ?? "");
    if (noteChanged) {
      await notifyUser({
        userId: row.userId,
        titleAr: "ملاحظة من الإدارة",
        titleEn: "A note from our team",
        messageAr: (body.adminNotes as string).slice(0, 480),
        messageEn: (body.adminNotes as string).slice(0, 480),
        relatedEntityType: "umrah_application",
        relatedEntityId: row.id,
      });
    }

    // 3. Issued visa file attached/changed.
    const fileChanged =
      typeof body.issuedVisaUrl === "string" &&
      body.issuedVisaUrl.trim().length > 0 &&
      body.issuedVisaUrl !== (prev.issuedVisaUrl ?? "");
    if (fileChanged) {
      await notifyUser({
        userId: row.userId,
        titleAr: "تأشيرة العمرة جاهزة للتحميل",
        titleEn: "Your Umrah visa is ready to download",
        messageAr: "تم إرفاق ملف تأشيرة العمرة. يمكنك الآن تحميلها من شاشة تتبع الطلب.",
        messageEn: "Your Umrah visa document has been attached. You can now download it from the tracking screen.",
        relatedEntityType: "umrah_application",
        relatedEntityId: row.id,
      });
    }

    if (statusChanged) {
      logAudit(req, "umrah_application.status_changed", { entityType: "umrah_application", newValue: { id: row.id, status: body.status } });
    }
    if (fileChanged) {
      logAudit(req, "umrah_application.visa_file_attached", { entityType: "umrah_application", newValue: { id: row.id } });
    }

    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
