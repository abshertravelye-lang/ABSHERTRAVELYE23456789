import { Router } from "express";
import { db } from "@workspace/db";
import {
  applicationDocumentsTable,
  applicationDocumentVersionsTable,
  visaRequiredDocumentsTable,
  visaApplicationSubmissionsTable,
  objectUploadsTable,
  usersTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { requireAuth, requirePermission, requireSuperAdmin, hasStaffPermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { sniffStoredObjectMime } from "../lib/fileSignature";
import { notifyUser, notifyManyUsers } from "../lib/notify";
import {
  RequestApplicationDocumentBody,
  UploadApplicationDocumentBody,
  RejectApplicationDocumentBody,
  CreateVisaRequiredDocumentBody,
  UpdateVisaRequiredDocumentBody,
} from "@workspace/api-zod";

const router = Router();

/**
 * Seed application_documents for a freshly submitted application:
 *  1. One row per visa_required_documents config entry for the visa.
 *  2. Standard profile documents (passport / photo / residence) mapped into
 *     rows referencing the stored profile object paths, each with an initial
 *     "uploaded" version, so admins see everything in one place.
 * Idempotent via the (applicationId, documentKey) unique constraint.
 */
export async function seedApplicationDocuments(application: {
  id: number;
  userId: string | null;
  visaId: number;
  passportImageUrl?: string | null;
  personalPhotoUrl?: string | null;
  residencyImageUrl?: string | null;
  residencyBackImageUrl?: string | null;
  visaImageUrl?: string | null;
}): Promise<void> {
  // ── 1. Visa-config documents ──────────────────────────────────────────────
  const configDocs = await db
    .select()
    .from(visaRequiredDocumentsTable)
    .where(eq(visaRequiredDocumentsTable.visaId, application.visaId));

  for (const cfg of configDocs) {
    await db
      .insert(applicationDocumentsTable)
      .values({
        applicationId: application.id,
        userId: application.userId,
        visaId: application.visaId,
        documentKey: cfg.documentKey,
        nameAr: cfg.nameAr,
        nameEn: cfg.nameEn,
        description: cfg.description,
        required: cfg.required,
        allowedFileType: cfg.allowedFileType as any,
        maxFileSizeMb: cfg.maxFileSizeMb,
        status: cfg.required ? "required" : "required",
        requestedBy: null,
      } as any)
      .onConflictDoNothing({
        target: [applicationDocumentsTable.applicationId, applicationDocumentsTable.documentKey],
      });
  }

  // ── 2. Standard profile documents with an initial version ─────────────────
  const standard: Array<{ key: string; nameAr: string; nameEn: string; path: string | null | undefined; type: "image" | "pdf" | "image_pdf" }> = [
    { key: "passport", nameAr: "جواز السفر", nameEn: "Passport", path: application.passportImageUrl, type: "image_pdf" },
    { key: "personal-photo", nameAr: "الصورة الشخصية", nameEn: "Personal Photo", path: application.personalPhotoUrl, type: "image" },
    { key: "residence", nameAr: "الإقامة", nameEn: "Residence", path: application.residencyImageUrl, type: "image_pdf" },
    { key: "residence-back", nameAr: "الإقامة (الوجه الخلفي)", nameEn: "Residence (Back)", path: application.residencyBackImageUrl, type: "image_pdf" },
    { key: "visa-document", nameAr: "التأشيرة / الإقامة الأوروبية", nameEn: "Visa / European Residence", path: application.visaImageUrl, type: "image_pdf" },
  ];

  for (const s of standard) {
    if (!s.path) continue;
    // Insert the slot (or fetch existing).
    const [docRow] = await db
      .insert(applicationDocumentsTable)
      .values({
        applicationId: application.id,
        userId: application.userId,
        visaId: application.visaId,
        documentKey: s.key,
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        description: null,
        required: true,
        allowedFileType: s.type as any,
        maxFileSizeMb: null,
        status: "uploaded",
        requestedBy: null,
      } as any)
      .onConflictDoNothing({
        target: [applicationDocumentsTable.applicationId, applicationDocumentsTable.documentKey],
      })
      .returning();

    // If the slot already existed (conflict → no row), skip version seeding.
    if (!docRow) continue;

    // Resolve upload metadata (owner/mime/size) if we recorded it at upload time.
    const [upload] = await db
      .select()
      .from(objectUploadsTable)
      .where(eq(objectUploadsTable.storagePath, s.path));

    const [version] = await db
      .insert(applicationDocumentVersionsTable)
      .values({
        documentId: docRow.id,
        storagePath: s.path,
        originalFilename: upload?.originalFilename ?? null,
        mimeType: upload?.mimeType ?? null,
        size: upload?.size ?? null,
        uploadedBy: application.userId,
        status: "uploaded",
        versionNumber: 1,
      } as any)
      .onConflictDoNothing()
      .returning();

    if (version) {
      await db
        .update(applicationDocumentsTable)
        .set({ currentVersionId: version.id, status: "uploaded", updatedAt: new Date() })
        .where(eq(applicationDocumentsTable.id, docRow.id));
    }
  }
}

// ── Notification copy ────────────────────────────────────────────────────────
const DOC_NOTIFICATIONS = {
  requested: {
    titleAr: "مستند إضافي مطلوب", titleEn: "Additional document required",
    messageAr: "يوجد مستند إضافي مطلوب لاستكمال معالجة طلب التأشيرة.",
    messageEn: "An additional document is required to continue processing your visa application.",
  },
  uploaded: {
    titleAr: "تم رفع مستند", titleEn: "Document uploaded",
    messageAr: "قام العميل برفع المستند المطلوب.",
    messageEn: "The customer has uploaded the requested document.",
  },
  approved: {
    titleAr: "تم قبول المستند", titleEn: "Document approved",
    messageAr: "تم قبول المستند المرفوع.",
    messageEn: "Your uploaded document has been approved.",
  },
  rejected: {
    titleAr: "تم رفض المستند", titleEn: "Document rejected",
    messageAr: "تم رفض المستند، يرجى إعادة رفعه.",
    messageEn: "Your document was rejected, please upload it again.",
  },
} as const;

// ── Serialization helpers ─────────────────────────────────────────────────────
const versionToResponse = (v: typeof applicationDocumentVersionsTable.$inferSelect) => ({
  ...v,
  uploadedAt: v.uploadedAt.toISOString(),
});

function docToResponse(
  d: typeof applicationDocumentsTable.$inferSelect,
  versions: (typeof applicationDocumentVersionsTable.$inferSelect)[],
) {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const currentVersion =
    (d.currentVersionId != null ? sorted.find((v) => v.id === d.currentVersionId) : undefined) ??
    sorted[0] ?? null;
  return {
    ...d,
    reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    currentVersion: currentVersion ? versionToResponse(currentVersion) : null,
    versions: sorted.map(versionToResponse),
  };
}

/** slugify a document name into a stable documentKey */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `doc-${Date.now()}`;
}

/** Load the application; returns null if not found. */
async function loadApplication(id: number) {
  const [row] = await db
    .select()
    .from(visaApplicationSubmissionsTable)
    .where(eq(visaApplicationSubmissionsTable.id, id));
  return row ?? null;
}

/**
 * B2B agent access check: TRUE iff the caller is an active travel-portal agent
 * (role "agent" with a non-null agency_id) AND the application belongs to the
 * caller's own agency. Used to extend the customer-only document routes to
 * agency applications (which have userId = null, agencyId set) with strict
 * per-agency isolation.
 */
async function agentOwnsApplication(
  callerId: string,
  application: { agencyId: number | null },
): Promise<boolean> {
  if (application.agencyId == null) return false;
  const [user] = await db
    .select({ role: usersTable.role, isActive: usersTable.isActive, agencyId: usersTable.agencyId })
    .from(usersTable)
    .where(and(eq(usersTable.id, callerId), isNull(usersTable.deletedAt)));
  return !!user && user.isActive && user.role === "agent" && user.agencyId === application.agencyId;
}

/** Notify every active agent of an agency (used for agency-owned applications). */
async function notifyAgencyAgents(
  agencyId: number,
  copy: { titleAr: string; titleEn: string; messageAr: string; messageEn: string },
  applicationId: number,
  extraMessage?: string,
) {
  const agents = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(
      eq(usersTable.agencyId, agencyId),
      eq(usersTable.role, "agent" as any),
      eq(usersTable.isActive, true),
      isNull(usersTable.deletedAt),
    ));
  if (agents.length === 0) return;
  await notifyManyUsers(agents.map((a) => a.id), {
    titleAr: copy.titleAr,
    titleEn: copy.titleEn,
    messageAr: extraMessage ? `${copy.messageAr}\n${extraMessage}` : copy.messageAr,
    messageEn: extraMessage ? `${copy.messageEn}\n${extraMessage}` : copy.messageEn,
    relatedEntityType: "agent_application",
    relatedEntityId: String(applicationId),
  });
}

/**
 * Route the "document event" notification to the right party:
 * customer-owned applications → the customer; agency-owned → the agency agents.
 */
async function notifyApplicant(
  application: { userId: string | null; agencyId: number | null; id: number },
  copy: { titleAr: string; titleEn: string; messageAr: string; messageEn: string },
  extraMessage?: string,
) {
  if (application.userId) {
    await notifyCustomer(application.userId, copy, application.id, extraMessage);
  } else if (application.agencyId != null) {
    await notifyAgencyAgents(application.agencyId, copy, application.id, extraMessage);
  }
}

/** Load documents + versions for an application. */
async function loadDocsWithVersions(applicationId: number) {
  const docs = await db
    .select()
    .from(applicationDocumentsTable)
    .where(eq(applicationDocumentsTable.applicationId, applicationId))
    .orderBy(asc(applicationDocumentsTable.id));
  if (docs.length === 0) return [];
  const versions = await db
    .select()
    .from(applicationDocumentVersionsTable)
    .where(inArray(applicationDocumentVersionsTable.documentId, docs.map((d) => d.id)))
    .orderBy(desc(applicationDocumentVersionsTable.versionNumber));
  const byDoc = new Map<number, (typeof versions)>();
  for (const v of versions) {
    const arr = byDoc.get(v.documentId) ?? [];
    arr.push(v);
    byDoc.set(v.documentId, arr);
  }
  return docs.map((d) => docToResponse(d, byDoc.get(d.id) ?? []));
}

// ── Notification helpers ──────────────────────────────────────────────────────
async function notifyCustomer(
  userId: string | null,
  copy: { titleAr: string; titleEn: string; messageAr: string; messageEn: string },
  applicationId: number,
  extraMessage?: string,
) {
  if (!userId) return;
  await notifyUser({
    userId,
    titleAr: copy.titleAr,
    titleEn: copy.titleEn,
    messageAr: extraMessage ? `${copy.messageAr}\n${extraMessage}` : copy.messageAr,
    messageEn: extraMessage ? `${copy.messageEn}\n${extraMessage}` : copy.messageEn,
    relatedEntityType: "visa_application",
    relatedEntityId: String(applicationId),
  });
}

/** Notify a single staff member if set, otherwise notify all admins/super_admins. */
async function notifyStaff(
  requestedBy: string | null,
  copy: { titleAr: string; titleEn: string; messageAr: string; messageEn: string },
  applicationId: number,
) {
  let recipients: string[];
  if (requestedBy) {
    recipients = [requestedBy];
  } else {
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(inArray(usersTable.role, ["admin", "super_admin"]), eq(usersTable.isActive, true), isNull(usersTable.deletedAt)));
    recipients = admins.map((a) => a.id);
  }
  if (recipients.length === 0) return;
  await notifyManyUsers(recipients, {
    titleAr: copy.titleAr,
    titleEn: copy.titleEn,
    messageAr: copy.messageAr,
    messageEn: copy.messageEn,
    relatedEntityType: "visa_application",
    relatedEntityId: String(applicationId),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /visa-applications/:id/documents — customer (own) or staff w/ perm
// ──────────────────────────────────────────────────────────────────────────────
router.get("/visa-applications/:id/documents", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid application id" });
    const application = await loadApplication(id);
    if (!application) return res.status(404).json({ error: "Application not found" });

    // Owner customer, owning-agency agent, or staff with the visa_applications
    // permission (DB-checked).
    const isOwnerCustomer = application.userId != null && application.userId === req.user!.sub;
    if (
      !isOwnerCustomer &&
      !(await agentOwnsApplication(req.user!.sub, application)) &&
      !(await hasStaffPermission(req.user!.sub, "visa_applications"))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const docs = await loadDocsWithVersions(id);
    res.json(docs);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /visa-applications/:id/documents/request — staff w/ documents_request
// Idempotent: same (applicationId, documentKey) upserts the existing slot so a
// double-click / retry never creates a duplicate.
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/visa-applications/:id/documents/request",
  requireAuth,
  requirePermission("documents_request"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid application id" });
      const body = RequestApplicationDocumentBody.parse(req.body);

      const application = await loadApplication(id);
      if (!application) return res.status(404).json({ error: "Application not found" });

      // Derive a stable key. Prefer an explicit documentKey; otherwise slugify the
      // name. This is what powers idempotency via the unique constraint.
      const documentKey = (body.documentKey && body.documentKey.trim()) || slugify(body.nameEn || body.nameAr);
      const allowedFileType = (body.fileType ?? "image_pdf") as "image" | "pdf" | "image_pdf";

      // Race-safe idempotency: a single INSERT ... ON CONFLICT on the unique
      // (applicationId, documentKey). No read-then-insert window. We detect
      // whether the row was freshly created using the `xmax` system column
      // (0 for a brand-new tuple), which lets two concurrent double-clicks agree
      // on exactly one "created" outcome. Status/required/etc. are only reset
      // for a brand-new slot; an existing slot keeps its uploaded state.
      const rows = await db.execute<{
        id: number;
        was_created: boolean;
      }>(sql`
        INSERT INTO application_documents
          (application_id, user_id, visa_id, document_key, name_ar, name_en,
           description, required, allowed_file_type, max_file_size_mb, status,
           requested_by, request_description, created_at, updated_at)
        VALUES (
          ${id}, ${application.userId}, ${application.visaId}, ${documentKey},
          ${body.nameAr}, ${body.nameEn}, ${body.description ?? null},
          ${body.required ?? true}, ${allowedFileType}, ${body.maxFileSizeMb ?? null},
          'waiting_customer', ${req.user!.sub}, ${body.description ?? null},
          now(), now()
        )
        ON CONFLICT (application_id, document_key) DO UPDATE SET
          name_ar = EXCLUDED.name_ar,
          name_en = EXCLUDED.name_en,
          description = COALESCE(EXCLUDED.description, application_documents.description),
          required = EXCLUDED.required,
          allowed_file_type = EXCLUDED.allowed_file_type,
          max_file_size_mb = COALESCE(EXCLUDED.max_file_size_mb, application_documents.max_file_size_mb),
          request_description = COALESCE(EXCLUDED.request_description, application_documents.request_description),
          requested_by = COALESCE(application_documents.requested_by, EXCLUDED.requested_by),
          -- Only reset to waiting_customer when nothing has been uploaded yet.
          status = CASE
            WHEN application_documents.current_version_id IS NULL THEN 'waiting_customer'::application_document_status
            ELSE application_documents.status
          END,
          updated_at = now()
        RETURNING id, (xmax = 0) AS was_created
      `);

      const resultRow = (rows as unknown as { rows?: Array<{ id: number; was_created: boolean }> }).rows
        ?? (rows as unknown as Array<{ id: number; was_created: boolean }>);
      const first = Array.isArray(resultRow) ? resultRow[0] : undefined;
      const created = !!first?.was_created;
      const docRowId = first?.id;

      const [docRow] = await db
        .select()
        .from(applicationDocumentsTable)
        .where(eq(applicationDocumentsTable.id, docRowId!));

      // Notify the applicant party (customer or agency agents) only when a
      // fresh request is raised.
      if (created) {
        await notifyApplicant(application, DOC_NOTIFICATIONS.requested, req.body?.description ?? undefined);
      }

      logAudit(req, "application_document.requested", {
        entityType: "application_document",
        entityId: String(docRow.id),
        newValue: { applicationId: id, documentKey, created },
      });

      const [full] = await loadDocsWithVersions(id).then((rows) => rows.filter((r) => r.id === docRow.id));
      res.status(created ? 201 : 200).json(full ?? docToResponse(docRow, []));
    } catch (e: unknown) {
      req.log.error(e);
      if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
        return res.status(400).json({ error: "Invalid input", details: e });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /visa-applications/:id/documents/:docId/upload — customer (owner only)
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/visa-applications/:id/documents/:docId/upload",
  requireAuth,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const docId = Number(req.params.docId);
      if (!Number.isInteger(id) || !Number.isInteger(docId)) {
        return res.status(400).json({ error: "Invalid id" });
      }
      const body = UploadApplicationDocumentBody.parse(req.body);

      const application = await loadApplication(id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      // Owning customer, or (for agency applications) an agent of the owning agency.
      const isOwnerCustomer = application.userId != null && application.userId === req.user!.sub;
      if (!isOwnerCustomer && !(await agentOwnsApplication(req.user!.sub, application))) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [doc] = await db
        .select()
        .from(applicationDocumentsTable)
        .where(and(eq(applicationDocumentsTable.id, docId), eq(applicationDocumentsTable.applicationId, id)));
      if (!doc) return res.status(404).json({ error: "Document not found" });

      // Validate the referenced object is owned by this customer (bound at upload).
      const [upload] = await db
        .select()
        .from(objectUploadsTable)
        .where(eq(objectUploadsTable.storagePath, body.storagePath));
      if (!upload) return res.status(400).json({ error: "Unknown storage object" });
      if (upload.ownerUserId !== req.user!.sub) {
        return res.status(403).json({ error: "You do not own the referenced document" });
      }

      // Validate the CONTENT-verified mime type vs allowedFileType. The
      // recorded upload.mimeType can be client-declared (presigned-URL path),
      // so the actual stored bytes are sniffed — fail closed on unreadable or
      // unrecognized content.
      const mime = (await sniffStoredObjectMime(body.storagePath)) ?? "";
      const isImage = mime.startsWith("image/");
      const isPdf = mime === "application/pdf";
      const allowed = doc.allowedFileType;
      const typeOk =
        (allowed === "image" && isImage) ||
        (allowed === "pdf" && isPdf) ||
        (allowed === "image_pdf" && (isImage || isPdf));
      if (!typeOk) {
        return res.status(400).json({
          error: `File type not allowed. Expected ${allowed}, got ${mime || "unrecognized content"}.`,
        });
      }

      // Validate size vs maxFileSizeMb.
      if (doc.maxFileSizeMb != null && upload.size != null) {
        const maxBytes = doc.maxFileSizeMb * 1024 * 1024;
        if (upload.size > maxBytes) {
          return res.status(400).json({ error: `File exceeds maximum size of ${doc.maxFileSizeMb} MB.` });
        }
      }

      // ── Concurrency-safe version creation ──────────────────────────────────
      // Runs in a transaction with a row lock on the document so two concurrent
      // uploads can't compute the same versionNumber. The unique constraints on
      // (documentId, versionNumber) and (documentId, storagePath) are the final
      // backstops. Re-uploading the SAME storagePath is a no-op that returns the
      // existing version (survives network retries with no duplicate/notify).
      const outcome = await db.transaction(async (tx) => {
        // Dedupe: same object already uploaded to this document → no-op.
        const [dup] = await tx
          .select()
          .from(applicationDocumentVersionsTable)
          .where(
            and(
              eq(applicationDocumentVersionsTable.documentId, docId),
              eq(applicationDocumentVersionsTable.storagePath, body.storagePath),
            ),
          );
        if (dup) {
          const [docRow] = await tx
            .select()
            .from(applicationDocumentsTable)
            .where(eq(applicationDocumentsTable.id, docId));
          return { deduped: true, version: dup, doc: docRow } as const;
        }

        // Lock the document row to serialize version-number assignment.
        const [lockedDoc] = await tx
          .select()
          .from(applicationDocumentsTable)
          .where(eq(applicationDocumentsTable.id, docId))
          .for("update");

        const [prior] = await tx
          .select({ versionNumber: applicationDocumentVersionsTable.versionNumber })
          .from(applicationDocumentVersionsTable)
          .where(eq(applicationDocumentVersionsTable.documentId, docId))
          .orderBy(desc(applicationDocumentVersionsTable.versionNumber))
          .limit(1);
        const nextVersion = (prior?.versionNumber ?? 0) + 1;

        const [version] = await tx
          .insert(applicationDocumentVersionsTable)
          .values({
            documentId: docId,
            storagePath: body.storagePath,
            originalFilename: upload.originalFilename ?? null,
            mimeType: upload.mimeType ?? null,
            size: upload.size ?? null,
            uploadedBy: req.user!.sub,
            status: "uploaded",
            versionNumber: nextVersion,
          } as any)
          .returning();

        const [updatedDoc] = await tx
          .update(applicationDocumentsTable)
          .set({
            currentVersionId: version.id,
            status: "under_review",
            rejectionReason: null,
            reviewedBy: null,
            reviewedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(applicationDocumentsTable.id, docId))
          .returning();

        void lockedDoc;
        return { deduped: false, version, doc: updatedDoc } as const;
      });

      // Notify staff + audit ONLY for a genuinely new version.
      if (!outcome.deduped) {
        await notifyStaff(doc.requestedBy, DOC_NOTIFICATIONS.uploaded, id);
        logAudit(req, "application_document.uploaded", {
          entityType: "application_document",
          entityId: String(docId),
          newValue: { versionNumber: outcome.version.versionNumber },
        });
      }

      const versions = await db
        .select()
        .from(applicationDocumentVersionsTable)
        .where(eq(applicationDocumentVersionsTable.documentId, docId));
      res.status(outcome.deduped ? 200 : 201).json(docToResponse(outcome.doc, versions));
    } catch (e: unknown) {
      req.log.error(e);
      if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
        return res.status(400).json({ error: "Invalid input", details: e });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /visa-applications/:id/documents/:docId/approve — staff w/ documents_review
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/visa-applications/:id/documents/:docId/approve",
  requireAuth,
  requirePermission("documents_review"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const docId = Number(req.params.docId);
      if (!Number.isInteger(id) || !Number.isInteger(docId)) {
        return res.status(400).json({ error: "Invalid id" });
      }
      const application = await loadApplication(id);
      if (!application) return res.status(404).json({ error: "Application not found" });

      const [doc] = await db
        .select()
        .from(applicationDocumentsTable)
        .where(and(eq(applicationDocumentsTable.id, docId), eq(applicationDocumentsTable.applicationId, id)));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      if (doc.currentVersionId == null) return res.status(422).json({ error: "No uploaded version to approve" });

      const [updatedDoc] = await db
        .update(applicationDocumentsTable)
        .set({
          status: "approved",
          rejectionReason: null,
          reviewedBy: req.user!.sub,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(applicationDocumentsTable.id, docId))
        .returning();

      await db
        .update(applicationDocumentVersionsTable)
        .set({ status: "approved", rejectionReason: null })
        .where(eq(applicationDocumentVersionsTable.id, doc.currentVersionId));

      await notifyApplicant(application, DOC_NOTIFICATIONS.approved);

      logAudit(req, "application_document.approved", {
        entityType: "application_document",
        entityId: String(docId),
      });

      const versions = await db
        .select()
        .from(applicationDocumentVersionsTable)
        .where(eq(applicationDocumentVersionsTable.documentId, docId));
      res.json(docToResponse(updatedDoc, versions));
    } catch (e) {
      req.log.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /visa-applications/:id/documents/:docId/reject — staff w/ documents_review
// Requires a rejectionReason. Sets status reupload_required, marks version rejected.
// ──────────────────────────────────────────────────────────────────────────────
router.post(
  "/visa-applications/:id/documents/:docId/reject",
  requireAuth,
  requirePermission("documents_review"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const docId = Number(req.params.docId);
      if (!Number.isInteger(id) || !Number.isInteger(docId)) {
        return res.status(400).json({ error: "Invalid id" });
      }
      const body = RejectApplicationDocumentBody.parse(req.body);
      const reason = body.rejectionReason.trim();
      if (!reason) return res.status(400).json({ error: "rejectionReason is required" });

      const application = await loadApplication(id);
      if (!application) return res.status(404).json({ error: "Application not found" });

      const [doc] = await db
        .select()
        .from(applicationDocumentsTable)
        .where(and(eq(applicationDocumentsTable.id, docId), eq(applicationDocumentsTable.applicationId, id)));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      if (doc.currentVersionId == null) return res.status(422).json({ error: "No uploaded version to reject" });

      const [updatedDoc] = await db
        .update(applicationDocumentsTable)
        .set({
          status: "reupload_required",
          rejectionReason: reason,
          reviewedBy: req.user!.sub,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(applicationDocumentsTable.id, docId))
        .returning();

      await db
        .update(applicationDocumentVersionsTable)
        .set({ status: "rejected", rejectionReason: reason })
        .where(eq(applicationDocumentVersionsTable.id, doc.currentVersionId));

      await notifyApplicant(application, DOC_NOTIFICATIONS.rejected, reason);

      logAudit(req, "application_document.rejected", {
        entityType: "application_document",
        entityId: String(docId),
        newValue: { rejectionReason: reason },
      });

      const versions = await db
        .select()
        .from(applicationDocumentVersionsTable)
        .where(eq(applicationDocumentVersionsTable.documentId, docId));
      res.json(docToResponse(updatedDoc, versions));
    } catch (e: unknown) {
      req.log.error(e);
      if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
        return res.status(400).json({ error: "Invalid input", details: e });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// Visa config CRUD — per-visa required-document definitions (super_admin/admin)
// ══════════════════════════════════════════════════════════════════════════════

const requiredDocToResponse = (r: typeof visaRequiredDocumentsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
});

// GET /visas/:id/required-documents — anyone authenticated may read the config
router.get("/visas/:id/required-documents", requireAuth, async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    if (!Number.isInteger(visaId)) return res.status(400).json({ error: "Invalid visa id" });
    const rows = await db
      .select()
      .from(visaRequiredDocumentsTable)
      .where(eq(visaRequiredDocumentsTable.visaId, visaId))
      .orderBy(asc(visaRequiredDocumentsTable.sortOrder), asc(visaRequiredDocumentsTable.id));
    res.json(rows.map(requiredDocToResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /visas/:id/required-documents — super_admin/admin only
router.post("/visas/:id/required-documents", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    if (!Number.isInteger(visaId)) return res.status(400).json({ error: "Invalid visa id" });
    const body = CreateVisaRequiredDocumentBody.parse(req.body);
    const documentKey = (body.documentKey && body.documentKey.trim()) || slugify(body.nameEn || body.nameAr);

    const [row] = await db
      .insert(visaRequiredDocumentsTable)
      .values({
        visaId,
        documentKey,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        description: body.description ?? null,
        required: body.required ?? true,
        allowedFileType: (body.allowedFileType ?? "image_pdf") as any,
        maxFileSizeMb: body.maxFileSizeMb ?? null,
        requiredAt: (body.requiredAt ?? "application_start") as any,
        sortOrder: body.sortOrder ?? 0,
      } as any)
      .onConflictDoUpdate({
        target: [visaRequiredDocumentsTable.visaId, visaRequiredDocumentsTable.documentKey],
        set: {
          nameAr: body.nameAr,
          nameEn: body.nameEn,
          description: body.description ?? null,
          required: body.required ?? true,
          allowedFileType: (body.allowedFileType ?? "image_pdf") as any,
          maxFileSizeMb: body.maxFileSizeMb ?? null,
          requiredAt: (body.requiredAt ?? "application_start") as any,
          sortOrder: body.sortOrder ?? 0,
        },
      })
      .returning();

    logAudit(req, "visa_required_document.created", {
      entityType: "visa_required_document",
      entityId: String(row.id),
      newValue: { visaId, documentKey },
    });
    res.status(201).json(requiredDocToResponse(row));
  } catch (e: unknown) {
    req.log.error(e);
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: e });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /visas/:id/required-documents/:docId — super_admin/admin only
router.patch("/visas/:id/required-documents/:docId", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!Number.isInteger(visaId) || !Number.isInteger(docId)) return res.status(400).json({ error: "Invalid id" });
    const body = UpdateVisaRequiredDocumentBody.parse(req.body);

    const set: Record<string, unknown> = {};
    if (body.documentKey !== undefined) set.documentKey = body.documentKey;
    if (body.nameAr !== undefined) set.nameAr = body.nameAr;
    if (body.nameEn !== undefined) set.nameEn = body.nameEn;
    if (body.description !== undefined) set.description = body.description;
    if (body.required !== undefined) set.required = body.required;
    if (body.allowedFileType !== undefined) set.allowedFileType = body.allowedFileType;
    if (body.maxFileSizeMb !== undefined) set.maxFileSizeMb = body.maxFileSizeMb;
    if (body.requiredAt !== undefined) set.requiredAt = body.requiredAt;
    if (body.sortOrder !== undefined) set.sortOrder = body.sortOrder;

    const [row] = await db
      .update(visaRequiredDocumentsTable)
      .set(set as any)
      .where(and(eq(visaRequiredDocumentsTable.id, docId), eq(visaRequiredDocumentsTable.visaId, visaId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    logAudit(req, "visa_required_document.updated", {
      entityType: "visa_required_document",
      entityId: String(docId),
    });
    res.json(requiredDocToResponse(row));
  } catch (e: unknown) {
    req.log.error(e);
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: e });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /visas/:id/required-documents/:docId — super_admin/admin only
router.delete("/visas/:id/required-documents/:docId", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const visaId = Number(req.params.id);
    const docId = Number(req.params.docId);
    if (!Number.isInteger(visaId) || !Number.isInteger(docId)) return res.status(400).json({ error: "Invalid id" });
    const [row] = await db
      .delete(visaRequiredDocumentsTable)
      .where(and(eq(visaRequiredDocumentsTable.id, docId), eq(visaRequiredDocumentsTable.visaId, visaId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    logAudit(req, "visa_required_document.deleted", {
      entityType: "visa_required_document",
      entityId: String(docId),
    });
    res.status(204).end();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
