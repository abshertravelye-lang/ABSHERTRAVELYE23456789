import { Router } from "express";
import { db } from "@workspace/db";
import { visaApplicationSubmissionsTable, visasTable, notificationsTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  CreateVisaApplicationBody,
  ListVisaApplicationsQueryParams,
  GetVisaApplicationParams,
  UpdateVisaApplicationParams,
  UpdateVisaApplicationBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// Arabic/English copy shown to the customer at every stage of the pipeline.
const STATUS_MESSAGES: Record<string, { titleAr: string; titleEn: string; messageAr: string; messageEn: string }> = {
  received: {
    titleAr: "تم استلام طلبك", titleEn: "Application received",
    messageAr: "لقد استلمنا طلب التأشيرة الخاص بك وسيتم مراجعته قريباً.",
    messageEn: "We've received your visa application and will review it shortly.",
  },
  under_review: {
    titleAr: "طلبك قيد المراجعة", titleEn: "Application under review",
    messageAr: "فريقنا يقوم الآن بمراجعة تفاصيل طلبك.",
    messageEn: "Our team is now reviewing the details of your application.",
  },
  awaiting_documents: {
    titleAr: "بانتظار مستندات إضافية", titleEn: "Awaiting additional documents",
    messageAr: "نحتاج إلى مستندات إضافية لاستكمال طلبك. يرجى رفعها في أقرب وقت.",
    messageEn: "We need additional documents to continue processing your application. Please upload them soon.",
  },
  documents_uploaded: {
    titleAr: "تم رفع المستندات", titleEn: "Documents uploaded",
    messageAr: "تم استلام مستنداتك وسيتم استكمال إجراءات طلبك.",
    messageEn: "Your documents have been received and processing will continue.",
  },
  sent_to_embassy: {
    titleAr: "تم إرسال الطلب للسفارة", titleEn: "Sent to embassy",
    messageAr: "تم إرسال طلبك إلى السفارة المعنية لاستكمال الإجراءات.",
    messageEn: "Your application has been forwarded to the embassy for processing.",
  },
  processing: {
    titleAr: "الطلب قيد المعالجة", titleEn: "Processing",
    messageAr: "السفارة تقوم حالياً بمعالجة طلبك.",
    messageEn: "The embassy is currently processing your application.",
  },
  issued: {
    titleAr: "تم إصدار التأشيرة", titleEn: "Visa issued",
    messageAr: "تهانينا! تم إصدار تأشيرتك بنجاح.",
    messageEn: "Congratulations! Your visa has been issued successfully.",
  },
  completed: {
    titleAr: "تم إكمال الطلب", titleEn: "Application completed",
    messageAr: "تم إكمال طلبك بنجاح. نتمنى لك رحلة سعيدة.",
    messageEn: "Your application has been completed. Have a great trip.",
  },
  rejected: {
    titleAr: "تم رفض الطلب", titleEn: "Application rejected",
    messageAr: "نأسف لإعلامك بأن طلبك لم يتم قبوله. يرجى التواصل معنا لمزيد من التفاصيل.",
    messageEn: "We're sorry to inform you that your application was not approved. Please contact us for details.",
  },
};

const toResponse = (r: typeof visaApplicationSubmissionsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// Normalizes a nationality string for case/whitespace-insensitive comparison
// against the free-text allow/block lists configured per-visa in the admin panel.
const normalize = (s: string) => s.trim().toLocaleLowerCase();

// Admins see everything; a logged-in customer only sees their own applications ("My Requests").
router.get("/visa-applications", requireAuth, async (req, res) => {
  try {
    const query = ListVisaApplicationsQueryParams.parse(req.query);
    const conditions = [];
    if (query.visaId) conditions.push(eq(visaApplicationSubmissionsTable.visaId, query.visaId));
    if (query.status) conditions.push(eq(visaApplicationSubmissionsTable.status, query.status));
    const isStaff = ["agent", "admin", "super_admin"].includes(req.user!.role);
    if (!isStaff) conditions.push(eq(visaApplicationSubmissionsTable.userId, req.user!.sub));
    const rows = await db
      .select()
      .from(visaApplicationSubmissionsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visaApplicationSubmissionsTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submitting a visa application requires an account — guests can browse visas freely,
// but must register/log in first, per the platform's auth policy.
router.post("/visa-applications", requireAuth, async (req, res) => {
  try {
    const body = CreateVisaApplicationBody.parse(req.body);

    const [visa] = await db
      .select()
      .from(visasTable)
      .where(and(eq(visasTable.id, body.visaId), isNull(visasTable.deletedAt)));
    if (!visa) return res.status(404).json({ error: "Visa not found" });

    // Server-side eligibility re-check (defense in depth — the client wizard
    // already gates the flow, but the same per-visa rules must hold here).
    if (body.eligibilityPath === "gcc" && !visa.acceptsGccResidency) {
      return res.status(422).json({ error: "GCC residency path is not accepted for this visa" });
    }
    if (body.eligibilityPath === "alternative") {
      const region = body.alternativeRegion;
      const regionAccepted =
        (region === "schengen" && visa.acceptsSchengenResidency) ||
        (region === "uk" && visa.acceptsUkResidency) ||
        (region === "usa" && visa.acceptsUsVisa) ||
        (region === "canada" && visa.acceptsCanadaResidency) ||
        (region === "australia" && visa.acceptsAustraliaResidency);
      if (!regionAccepted) {
        return res.status(422).json({ error: "Selected residency/visa region is not accepted for this visa" });
      }
    }
    if (body.eligibilityPath === "direct") {
      const nationality = normalize(body.nationality);
      const blocked = visa.blockedNationalities.some((n) => normalize(n) === nationality);
      const allowedList = visa.allowedNationalities;
      const allowed = allowedList.length === 0 || allowedList.some((n) => normalize(n) === nationality);
      if (blocked || !allowed) {
        const message = req.headers["x-lang"] === "en"
          ? (visa.ineligibleMessageEn || "Sorry, you are not eligible to apply for this visa.")
          : (visa.ineligibleMessageAr || "عذراً، لا يمكنك التقديم على هذه التأشيرة وفق الشروط المحددة.");
        return res.status(422).json({ error: message });
      }
    }

    const data: Record<string, unknown> = { ...body, userId: req.user!.sub };
    const [row] = await db.insert(visaApplicationSubmissionsTable).values(data as never).returning();

    await db.insert(notificationsTable).values({
      userId: req.user!.sub,
      ...STATUS_MESSAGES.received,
      relatedEntityType: "visa_application",
      relatedEntityId: String(row.id),
    });

    res.status(201).json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/visa-applications/:id", requireAuth, async (req, res) => {
  try {
    const { id } = GetVisaApplicationParams.parse({ id: Number(req.params.id) });
    const [row] = await db.select().from(visaApplicationSubmissionsTable).where(eq(visaApplicationSubmissionsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    const isStaff = ["agent", "admin", "super_admin"].includes(req.user!.role);
    if (!isStaff && row.userId !== req.user!.sub) return res.status(403).json({ error: "Forbidden" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Only staff can change an application's status; every change fires a
// notification (section 7/9 of the spec: notify the customer at every stage).
router.patch("/visa-applications/:id", requireAuth, requireRole("agent", "admin", "super_admin"), async (req, res) => {
  try {
    const { id } = UpdateVisaApplicationParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaApplicationBody.parse(req.body);
    const [row] = await db
      .update(visaApplicationSubmissionsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(visaApplicationSubmissionsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    if (body.status && row.userId) {
      const copy = STATUS_MESSAGES[body.status];
      if (copy) {
        await db.insert(notificationsTable).values({
          userId: row.userId,
          ...copy,
          relatedEntityType: "visa_application",
          relatedEntityId: String(row.id),
        });
      }
    }

    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
