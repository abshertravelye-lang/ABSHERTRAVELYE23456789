import { Router } from "express";
import { db } from "@workspace/db";
import {
  agenciesTable,
  agencyVisaServicesTable,
  visasTable,
  visaApplicationSubmissionsTable,
  usersTable,
  visaRequiredDocumentsTable,
  applicationDocumentsTable,
  applicationDocumentVersionsTable,
  objectUploadsTable,
} from "@workspace/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireAgent } from "../middleware/auth";
import { isSameCountry } from "@workspace/countries";
import { canonicalCountryEn } from "@workspace/countries";
import { findUnownedObjectPath } from "../lib/objectAccess";
import { sniffStoredObjectMime } from "../lib/fileSignature";
import { seedApplicationDocuments } from "./applicationDocuments";
import { notifyManyUsers } from "../lib/notify";
import { logAudit } from "../lib/audit";

const router = Router();

// ═════════════════════════════════════════════════════════════════════════════
// B2B AGENT PORTAL — role "agent" WITH a non-null users.agency_id.
// Every route enforces isolation server-side (section 12 of the spec):
//   * agents only ever see their own agency, its enabled visas + AGENT price,
//     and applications submitted under their agency.
//   * agents can never change prices, enable services, or reach admin routes.
// ═════════════════════════════════════════════════════════════════════════════

/** Generate a unique agent application number: AG-YYYY-NNNNNN */
function generateAgentApplicationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AG-${year}-${rand}`;
}

// ── GET /api/agent/me — agency info + status ────────────────────────────────
// Uses allowInactiveAgency so a suspended/pending agent can still see WHY they
// are blocked. All other agent routes require an ACTIVE agency.
router.get("/agent/me", requireAuth, requireAgent({ allowInactiveAgency: true }), async (req, res) => {
  const ctx = req.agent!;
  const [user] = await db.select({
    id: usersTable.id, email: usersTable.email, phone: usersTable.phone,
    firstName: usersTable.firstName, lastName: usersTable.lastName,
  }).from(usersTable).where(eq(usersTable.id, ctx.userId));
  const [agency] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, ctx.agencyId));
  res.json({
    agent: {
      id: user?.id,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
    },
    agency: {
      id: agency.id,
      name: agency.name,
      status: agency.status,
      contactEmail: agency.contactEmail,
      contactPhone: agency.contactPhone,
    },
  });
});

// ── GET /api/agent/dashboard — stats scoped to the agent's agency ────────────
router.get("/agent/dashboard", requireAuth, requireAgent(), async (req, res) => {
  const ctx = req.agent!;
  const rows = await db.select({
    status: visaApplicationSubmissionsTable.status,
    count: sql<number>`count(*)::int`,
  })
    .from(visaApplicationSubmissionsTable)
    .where(eq(visaApplicationSubmissionsTable.agencyId, ctx.agencyId))
    .groupBy(visaApplicationSubmissionsTable.status);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byStatus[r.status] = r.count;
    total += r.count;
  }

  const approved = byStatus["issued"] ?? 0;
  const completed = byStatus["completed"] ?? 0;
  const rejected = byStatus["rejected"] ?? 0;
  const cancelled = byStatus["cancelled"] ?? 0;
  // "In progress" = anything not terminal.
  const inProgress = total - approved - completed - rejected - cancelled;
  // "Submitted" = received/under_review (freshly submitted, not yet processed).
  const submitted = (byStatus["received"] ?? 0) + (byStatus["under_review"] ?? 0);

  res.json({
    agencyName: ctx.agencyName,
    agencyStatus: ctx.agencyStatus,
    stats: {
      total,
      submitted,
      approved: approved + completed,
      rejected,
      inProgress,
      byStatus,
    },
  });
});

// ── GET /api/agent/visa-services — only enabled visas + AGENT price ──────────
// The customer price (visas.fee) is NEVER returned here.
router.get("/agent/visa-services", requireAuth, requireAgent(), async (req, res) => {
  const ctx = req.agent!;
  const rows = await db.select({
    serviceId: agencyVisaServicesTable.id,
    visaId: visasTable.id,
    agentPrice: agencyVisaServicesTable.agentPrice,
    currency: agencyVisaServicesTable.currency,
    countryAr: visasTable.countryAr,
    countryEn: visasTable.countryEn,
    countryCode: visasTable.countryCode,
    visaType: visasTable.visaType,
    category: visasTable.category,
    descriptionAr: visasTable.descriptionAr,
    descriptionEn: visasTable.descriptionEn,
    processingDays: visasTable.processingDays,
    stayDuration: visasTable.stayDuration,
    validityDays: visasTable.validityDays,
    entryType: visasTable.entryType,
    allowedNationalities: visasTable.allowedNationalities,
    blockedNationalities: visasTable.blockedNationalities,
    imageUrl: visasTable.imageUrl,
    requiresPassportImage: visasTable.requiresPassportImage,
    requiresPersonalPhoto: visasTable.requiresPersonalPhoto,
  })
    .from(agencyVisaServicesTable)
    .innerJoin(visasTable, eq(visasTable.id, agencyVisaServicesTable.visaId))
    .where(and(
      eq(agencyVisaServicesTable.agencyId, ctx.agencyId),
      eq(agencyVisaServicesTable.enabled, true),
      eq(visasTable.isActive, true),
      eq(visasTable.status, "available"),
      isNull(visasTable.deletedAt),
    ));
  res.json(rows);
});

// ── POST /api/agent/applications — submit a new application ──────────────────
const submitSchema = z.object({
  visaId: z.number().int().positive(),
  applicantNationality: z.string().min(1),
  fullName: z.string().min(1),
  fullNameEn: z.string().optional(),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  passportNumber: z.string().min(1),
  passportIssueDate: z.string().min(1),
  passportExpiryDate: z.string().min(1),
  passportIssuingCountry: z.string().optional(),
  countryOfResidence: z.string().optional(),
  passportImageUrl: z.string().optional(),
  personalPhotoUrl: z.string().optional(),
  residencyImageUrl: z.string().optional(),
  residencyBackImageUrl: z.string().optional(),
  visaImageUrl: z.string().optional(),
  customFieldResponses: z.record(z.string(), z.unknown()).optional(),
  agreedToTerms: z.boolean().optional(),
  // Dynamic documents: entries keyed to the visa's required-documents config,
  // plus optional ad-hoc extras (documentKey absent/unknown → named slot).
  documents: z.array(z.object({
    documentKey: z.string().optional(),
    nameAr: z.string().optional(),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    storagePath: z.string().min(1),
  })).optional(),
});

router.post("/agent/applications", requireAuth, requireAgent(), async (req, res) => {
  try {
    const ctx = req.agent!;
    const ar = req.headers["x-lang"] === "ar";
    const body = submitSchema.parse(req.body);

    // 1. Visa must be enabled for THIS agency → yields the authoritative price.
    const [service] = await db.select({
      agentPrice: agencyVisaServicesTable.agentPrice,
      currency: agencyVisaServicesTable.currency,
    })
      .from(agencyVisaServicesTable)
      .where(and(
        eq(agencyVisaServicesTable.agencyId, ctx.agencyId),
        eq(agencyVisaServicesTable.visaId, body.visaId),
        eq(agencyVisaServicesTable.enabled, true),
      ));
    if (!service) {
      return res.status(422).json({ error: ar ? "هذه التأشيرة غير متاحة لوكالتك." : "This visa is not available for your agency." });
    }

    // 2. Visa must exist & be available.
    const [visa] = await db.select().from(visasTable)
      .where(and(eq(visasTable.id, body.visaId), isNull(visasTable.deletedAt)));
    if (!visa) return res.status(404).json({ error: "Visa not found" });
    if (!visa.isActive || visa.status !== "available") {
      return res.status(422).json({ error: ar ? "هذه التأشيرة غير متاحة حالياً." : "This visa is not currently available." });
    }

    // 3. Applicant nationality must satisfy the visa's existing rules
    //    (blocked list always wins; allowed list, if non-empty, must contain it).
    const nationality = canonicalCountryEn(body.applicantNationality) ?? body.applicantNationality;
    const blocked = (visa.blockedNationalities ?? []).some((n) => isSameCountry(n, nationality));
    if (blocked) {
      return res.status(422).json({
        error: ar
          ? (visa.ineligibleMessageAr || "هذه الجنسية غير مؤهلة لهذه التأشيرة.")
          : (visa.ineligibleMessageEn || "This nationality is not eligible for this visa."),
      });
    }
    const allowed = visa.allowedNationalities ?? [];
    if (allowed.length > 0 && !allowed.some((n) => isSameCountry(n, nationality))) {
      return res.status(422).json({
        error: ar
          ? (visa.ineligibleMessageAr || "هذه الجنسية غير مؤهلة لهذه التأشيرة.")
          : (visa.ineligibleMessageEn || "This nationality is not eligible for this visa."),
      });
    }

    // 4. Required documents must be provided AND owned by the calling agent
    //    (object_uploads ownership — prevents referencing another party's file).
    const docPaths: Array<string | null | undefined> = [
      body.passportImageUrl, body.personalPhotoUrl,
      body.residencyImageUrl, body.residencyBackImageUrl, body.visaImageUrl,
      ...(body.documents ?? []).map((d) => d.storagePath),
    ];
    const customValues = body.customFieldResponses
      ? Object.values(body.customFieldResponses).filter((v): v is string => typeof v === "string")
      : [];

    if (visa.requiresPassportImage && !body.passportImageUrl) {
      return res.status(422).json({ error: ar ? "صورة جواز السفر مطلوبة." : "Passport image is required." });
    }
    if (visa.requiresPersonalPhoto && !body.personalPhotoUrl) {
      return res.status(422).json({ error: ar ? "الصورة الشخصية مطلوبة." : "Personal photo is required." });
    }

    // 4b. Dynamic requirements: every REQUIRED visa-config document must have a
    //     matching upload (by documentKey). This is authoritative — the client
    //     UI is generated from the same config.
    const configDocs = await db
      .select()
      .from(visaRequiredDocumentsTable)
      .where(eq(visaRequiredDocumentsTable.visaId, body.visaId))
      .orderBy(asc(visaRequiredDocumentsTable.sortOrder), asc(visaRequiredDocumentsTable.id));
    const providedByKey = new Map(
      (body.documents ?? []).filter((d) => d.documentKey).map((d) => [d.documentKey!, d]),
    );
    const missing = configDocs.filter((c) => c.required && !providedByKey.get(c.documentKey)?.storagePath);
    if (missing.length > 0) {
      const names = missing.map((m) => (ar ? m.nameAr : m.nameEn)).join("، ");
      return res.status(422).json({
        error: ar ? `المستندات التالية مطلوبة: ${names}` : `The following documents are required: ${names}`,
      });
    }

    const unowned = await findUnownedObjectPath(ctx.userId, [...docPaths, ...customValues]);
    if (unowned) {
      return res.status(403).json({ error: ar ? "لا تملك أحد المستندات المشار إليها." : "You do not own one of the referenced documents." });
    }

    // 4c. Validate every submitted dynamic document server-side BEFORE creating
    //     anything — mirrors the re-upload endpoint's checks so initial
    //     submissions cannot bypass the visa_required_documents contract:
    //     the object must exist and be owned by this agent, and its MIME type
    //     and size must satisfy the matched config slot (ad-hoc extras get the
    //     image/pdf + default-size rules).
    const DEFAULT_MAX_UPLOAD_MB = 10;
    const uploadsByPath = new Map<string, typeof objectUploadsTable.$inferSelect>();
    const verifiedMimeByPath = new Map<string, string | null>();
    for (const d of body.documents ?? []) {
      let upload = uploadsByPath.get(d.storagePath);
      if (!upload) {
        const [found] = await db
          .select()
          .from(objectUploadsTable)
          .where(eq(objectUploadsTable.storagePath, d.storagePath));
        if (!found) {
          return res.status(400).json({ error: ar ? "أحد الملفات المشار إليها غير معروف." : "Unknown storage object referenced." });
        }
        upload = found;
        uploadsByPath.set(d.storagePath, upload);
      }
      if (upload.ownerUserId !== ctx.userId) {
        return res.status(403).json({ error: ar ? "لا تملك أحد المستندات المشار إليها." : "You do not own one of the referenced documents." });
      }

      const cfg = d.documentKey ? configDocs.find((c) => c.documentKey === d.documentKey) : undefined;
      if (d.documentKey && !cfg) {
        // Unknown key: only acceptable as a deliberate ad-hoc extra, which must
        // carry a display name — otherwise reject the stray key.
        if (!d.nameAr && !d.nameEn) {
          return res.status(422).json({
            error: ar ? `مفتاح مستند غير معروف: ${d.documentKey}` : `Unknown document key: ${d.documentKey}`,
          });
        }
      }
      const docLabel = ar ? (cfg?.nameAr ?? d.nameAr ?? d.documentKey ?? "مستند") : (cfg?.nameEn ?? d.nameEn ?? d.documentKey ?? "document");

      // Content-verified mime type (magic bytes of the STORED object) — the
      // recorded upload.mimeType may be client-declared (presigned-URL path)
      // and is never trusted for type enforcement. Fails closed.
      if (!verifiedMimeByPath.has(d.storagePath)) {
        verifiedMimeByPath.set(d.storagePath, await sniffStoredObjectMime(d.storagePath));
      }
      const mime = verifiedMimeByPath.get(d.storagePath) ?? "";
      const isImage = mime.startsWith("image/");
      const isPdf = mime === "application/pdf";
      const allowedType = cfg?.allowedFileType ?? "image_pdf";
      const typeOk =
        (allowedType === "image" && isImage) ||
        (allowedType === "pdf" && isPdf) ||
        (allowedType === "image_pdf" && (isImage || isPdf));
      if (!typeOk) {
        return res.status(422).json({
          error: ar
            ? `نوع الملف غير مسموح للمستند "${docLabel}" (المطلوب: ${allowedType === "image" ? "صورة" : allowedType === "pdf" ? "PDF" : "صورة أو PDF"}).`
            : `File type not allowed for document "${docLabel}". Expected ${allowedType}, got ${mime || "unknown"}.`,
        });
      }

      const maxMb = cfg?.maxFileSizeMb ?? DEFAULT_MAX_UPLOAD_MB;
      if (upload.size != null && upload.size > maxMb * 1024 * 1024) {
        return res.status(422).json({
          error: ar
            ? `حجم الملف للمستند "${docLabel}" يتجاوز الحد الأقصى (${maxMb} م.ب).`
            : `File for document "${docLabel}" exceeds the maximum size of ${maxMb} MB.`,
        });
      }
    }

    // 5. Generate a unique AG- tracking number.
    let trackingNumber = generateAgentApplicationNumber();
    for (let attempts = 0; attempts < 5; attempts++) {
      const [existing] = await db.select({ id: visaApplicationSubmissionsTable.id })
        .from(visaApplicationSubmissionsTable)
        .where(eq(visaApplicationSubmissionsTable.trackingNumber, trackingNumber));
      if (!existing) break;
      trackingNumber = generateAgentApplicationNumber();
    }

    // 6. Insert into the SAME visa_application_submissions table.
    //    Price is taken SERVER-SIDE from agency_visa_services — never the client.
    const insertData = {
      trackingNumber,
      visaId: body.visaId,
      userId: null, // agent applications belong to the agency, not a customer user
      eligibilityPath: "direct",
      fullName: body.fullName,
      fullNameEn: body.fullNameEn ?? body.fullName,
      nationality,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      countryOfResidence: body.countryOfResidence ?? null,
      email: body.email,
      phone: body.phone,
      passportNumber: body.passportNumber,
      passportIssueDate: body.passportIssueDate,
      passportExpiryDate: body.passportExpiryDate,
      passportIssuingCountry: body.passportIssuingCountry ?? null,
      passportImageUrl: body.passportImageUrl ?? null,
      personalPhotoUrl: body.personalPhotoUrl ?? null,
      residencyImageUrl: body.residencyImageUrl ?? null,
      residencyBackImageUrl: body.residencyBackImageUrl ?? null,
      visaImageUrl: body.visaImageUrl ?? null,
      customFieldResponses: body.customFieldResponses ?? {},
      agreedToTerms: body.agreedToTerms ?? true,
      status: "received",
      // ── Agent-portal fields ──
      agencyId: ctx.agencyId,
      submittedByAgentId: ctx.userId,
      agentPrice: String(service.agentPrice) as any,
    };

    const [row] = await db.insert(visaApplicationSubmissionsTable).values(insertData as never).returning();

    // Seed document slots + attach the dynamic uploads. NOT best-effort here:
    // the dynamic documents are part of the application's validity, so on
    // failure we delete the just-created application (compensating action)
    // and surface the error instead of leaving a half-formed submission.
    try {
      await seedApplicationDocuments({
        id: row.id,
        userId: null, // agency-owned application: no customer user
        visaId: row.visaId,
        passportImageUrl: row.passportImageUrl,
        personalPhotoUrl: row.personalPhotoUrl,
        residencyImageUrl: row.residencyImageUrl,
        residencyBackImageUrl: row.residencyBackImageUrl,
        visaImageUrl: row.visaImageUrl,
      });

      // Attach each provided document to its slot (config slot by documentKey,
      // otherwise an ad-hoc named slot) with an initial version.
      for (const d of body.documents ?? []) {
        const key = (d.documentKey && d.documentKey.trim())
          || (d.nameEn || d.nameAr || "").toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "")
          || `doc-${Date.now()}`;
        const cfg = configDocs.find((c) => c.documentKey === key);

        // Upsert the slot (seed already created config slots).
        const [slot] = await db
          .insert(applicationDocumentsTable)
          .values({
            applicationId: row.id,
            userId: null,
            visaId: row.visaId,
            documentKey: key,
            nameAr: d.nameAr ?? cfg?.nameAr ?? key,
            nameEn: d.nameEn ?? cfg?.nameEn ?? key,
            description: d.description ?? cfg?.description ?? null,
            required: cfg?.required ?? false,
            allowedFileType: (cfg?.allowedFileType ?? "image_pdf") as any,
            maxFileSizeMb: cfg?.maxFileSizeMb ?? null,
            status: "uploaded",
            requestedBy: null,
          } as any)
          .onConflictDoUpdate({
            target: [applicationDocumentsTable.applicationId, applicationDocumentsTable.documentKey],
            set: { updatedAt: new Date() },
          })
          .returning();

        const upload = uploadsByPath.get(d.storagePath);

        const [version] = await db
          .insert(applicationDocumentVersionsTable)
          .values({
            documentId: slot.id,
            storagePath: d.storagePath,
            originalFilename: upload?.originalFilename ?? null,
            mimeType: upload?.mimeType ?? null,
            size: upload?.size ?? null,
            uploadedBy: ctx.userId,
            status: "uploaded",
            versionNumber: 1,
          } as any)
          .onConflictDoNothing()
          .returning();

        if (version) {
          await db
            .update(applicationDocumentsTable)
            .set({ currentVersionId: version.id, status: "uploaded", updatedAt: new Date() })
            .where(eq(applicationDocumentsTable.id, slot.id));
        }
      }
    } catch (seedErr) {
      req.log.error({ err: seedErr }, "Failed to seed/attach agent application documents — rolling back application");
      await db.delete(visaApplicationSubmissionsTable).where(eq(visaApplicationSubmissionsTable.id, row.id));
      return res.status(500).json({ error: ar ? "تعذر حفظ مستندات الطلب، لم يتم إنشاء الطلب." : "Could not save the application documents; the application was not created." });
    }

    // Notify ABSHER TRAVEL staff who process agent applications.
    try {
      const staff = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(sql`${usersTable.permissions} ? 'visa_applications'`, eq(usersTable.isActive, true), isNull(usersTable.deletedAt)));
      const admins = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(sql`${usersTable.role} IN ('admin','super_admin')`, eq(usersTable.isActive, true), isNull(usersTable.deletedAt)));
      const ids = [...new Set([...staff.map((s) => s.id), ...admins.map((a) => a.id)])];
      if (ids.length > 0) {
        await notifyManyUsers(ids, {
          titleAr: "طلب تأشيرة جديد من وكالة",
          titleEn: "New agency visa application",
          messageAr: `تم استلام طلب جديد ${row.trackingNumber} من ${ctx.agencyName}.`,
          messageEn: `New application ${row.trackingNumber} received from ${ctx.agencyName}.`,
          relatedEntityType: "agent_application",
          relatedEntityId: String(row.id),
        });
      }
    } catch (notifyErr) {
      req.log.error({ err: notifyErr }, "Failed to notify staff of agent application");
    }

    logAudit(req, "agent_application.submitted", { entityType: "visa_application", entityId: String(row.id), newValue: { agencyId: ctx.agencyId, trackingNumber } });
    res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "An error occurred while submitting the application." });
  }
});

// ── GET /api/agent/applications — own agency only ────────────────────────────
router.get("/agent/applications", requireAuth, requireAgent(), async (req, res) => {
  const ctx = req.agent!;
  const rows = await db.select({
    app: visaApplicationSubmissionsTable,
    visaType: visasTable.visaType,
    countryEn: visasTable.countryEn,
    countryAr: visasTable.countryAr,
  })
    .from(visaApplicationSubmissionsTable)
    .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
    .where(eq(visaApplicationSubmissionsTable.agencyId, ctx.agencyId))
    .orderBy(desc(visaApplicationSubmissionsTable.createdAt));
  res.json(rows.map((r) => ({
    ...r.app,
    createdAt: r.app.createdAt.toISOString(),
    updatedAt: r.app.updatedAt.toISOString(),
    visaType: r.visaType,
    countryEn: r.countryEn,
    countryAr: r.countryAr,
  })));
});

// ── GET /api/agent/applications/:id — own agency only ────────────────────────
router.get("/agent/applications/:id", requireAuth, requireAgent(), async (req, res) => {
  const ctx = req.agent!;
  const id = Number(req.params.id);
  const [row] = await db.select({
    app: visaApplicationSubmissionsTable,
    visaType: visasTable.visaType,
    countryEn: visasTable.countryEn,
    countryAr: visasTable.countryAr,
  })
    .from(visaApplicationSubmissionsTable)
    .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
    .where(eq(visaApplicationSubmissionsTable.id, id));
  // Strict isolation: not found OR belongs to another agency → 404.
  if (!row || row.app.agencyId !== ctx.agencyId) return res.status(404).json({ error: "Not found" });
  res.json({
    ...row.app,
    createdAt: row.app.createdAt.toISOString(),
    updatedAt: row.app.updatedAt.toISOString(),
    visaType: row.visaType,
    countryEn: row.countryEn,
    countryAr: row.countryAr,
  });
});

export default router;
