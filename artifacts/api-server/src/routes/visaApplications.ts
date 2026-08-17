import { Router } from "express";
import { db } from "@workspace/db";
import { visaApplicationSubmissionsTable, visasTable, usersTable } from "@workspace/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  ListVisaApplicationsQueryParams,
  GetVisaApplicationParams,
  UpdateVisaApplicationParams,
  UpdateVisaApplicationBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole, optionalAuth, requirePermission, hasStaffPermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { isSameCountry } from "@workspace/countries";
import { isProfileComplete } from "./auth";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { ObjectStorageService } from "../lib/objectStorage";
import { isAuthorizedForObject, findUnownedObjectPath } from "../lib/objectAccess";
import { seedApplicationDocuments } from "./applicationDocuments";
import { notifyUser } from "../lib/notify";

const objectStorageService = new ObjectStorageService();

const router = Router();

// ── OCR client ─────────────────────────────────────────────────────────────
// Uses Replit AI Integrations proxy when configured (no OpenAI credits needed),
// otherwise falls back to the user's own OPENAI_API_KEY.
const openai =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY
    ? new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Status notification copy ───────────────────────────────────────────────
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
  cancelled: {
    titleAr: "تم إلغاء الطلب", titleEn: "Application cancelled",
    messageAr: "تم إلغاء طلبك.",
    messageEn: "Your application has been cancelled.",
  },
};

const toResponse = (r: typeof visaApplicationSubmissionsTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

/** Generate unique application number: AT-YYYY-NNNNNN */
function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AT-${year}-${rand}`;
}

/** Core eligibility engine — called by both the pre-check endpoint and submission.
 *  Priority order (as per admin spec):
 *  1. Prohibited nationality → BLOCK immediately (cannot be overridden)
 *  2. Allowed nationalities list (if non-empty) → must be in list
 *  3. GCC residency requirement → check stored profile + accepted GCC countries
 *  4. European/Schengen logic → check stored profile document type
 */
function checkEligibility(
  user: typeof usersTable.$inferSelect,
  visa: typeof visasTable.$inferSelect,
  ar: boolean,
): { eligible: boolean; reason?: string } {
  const nationality = user.nationality ?? "";
  const ineligibleAr = visa.ineligibleMessageAr || "لا يمكنك التقديم على هذه التأشيرة";
  const ineligibleEn = visa.ineligibleMessageEn || "You cannot apply for this visa.";

  // ── Step 1: Prohibited nationality ALWAYS wins ─────────────────────────────
  const blocked = visa.blockedNationalities.some((n) => isSameCountry(n, nationality));
  if (blocked) {
    return { eligible: false, reason: ar ? ineligibleAr : ineligibleEn };
  }

  // ── Step 2: Allowed nationalities list (empty = open to all non-blocked) ───
  const allowedList = visa.allowedNationalities ?? [];
  if (allowedList.length > 0) {
    const allowed = allowedList.some((n) => isSameCountry(n, nationality));
    if (!allowed) {
      return {
        eligible: false,
        reason: ar
          ? (visa.ineligibleMessageAr || "جنسيتك غير مؤهلة للتقديم على هذه التأشيرة")
          : (visa.ineligibleMessageEn || "Your nationality is not eligible for this visa."),
      };
    }
  }

  // ── Step 3: GCC residency requirement ─────────────────────────────────────
  // New field: gccResidencyRequirement ("not_required" | "required")
  // Fallback to legacy fields for backwards compatibility
  const gccReq: string = (visa as unknown as Record<string, unknown>).gccResidencyRequirement as string ??
    (visa.acceptsGccResidency && (visa.requiredResidencies ?? []).includes("gcc") ? "required" : "not_required");

  if (gccReq === "required" || gccReq === "required_for_nationalities") {
    if (!user.isGccResident || !user.gccResidenceCountry) {
      return {
        eligible: false,
        reason: ar
          ? "هذه التأشيرة تتطلب إقامة خليجية سارية. يرجى إضافة بيانات إقامتك الخليجية في ملفك الشخصي."
          : "This visa requires a valid GCC residence. Please add your GCC residency details to your profile.",
      };
    }
    // Check that user's GCC country is in the accepted list (if specified)
    const acceptedGcc: string[] = ((visa as unknown as Record<string, unknown>).acceptedGccCountries as string[]) ?? [];
    if (acceptedGcc.length > 0) {
      // Exact-match on canonical country values — never substring.
      const accepted = acceptedGcc.some((c) => isSameCountry(c, user.gccResidenceCountry));
      if (!accepted) {
        const list = acceptedGcc.join(ar ? "، " : ", ");
        return {
          eligible: false,
          reason: ar
            ? `إقامتك الخليجية غير مقبولة لهذه التأشيرة. الدول المقبولة: ${list}`
            : `Your GCC residence country is not accepted for this visa. Accepted: ${list}`,
        };
      }
    }
  }

  // ── Step 4: European / Schengen logic ──────────────────────────────────────
  // europeanSchengenLogic: "neither" | "european_only" | "schengen_only" | "either" | "both"
  const euLogic: string = ((visa as unknown as Record<string, unknown>).europeanSchengenLogic as string) ?? "neither";

  if (euLogic !== "neither") {
    const docType = (user.europeanDocumentType ?? "").toLowerCase();
    const hasDoc = !!(user as unknown as Record<string, unknown>).europeanDocumentUrl;
    const isEuResident = !!(user as unknown as Record<string, unknown>).isEuropeanResident;

    const isEuResidencyType = hasDoc && isEuResident &&
      (docType === "eu_residency" || docType === "uk_residency");
    const isSchengenType = hasDoc && isEuResident &&
      (docType === "schengen_visa" || docType === "uk_visa");
    const hasAnyEuDoc = hasDoc && isEuResident;

    if (euLogic === "european_only" && !isEuResidencyType) {
      return {
        eligible: false,
        reason: ar
          ? "هذه التأشيرة تتطلب إقامة أوروبية سارية (UK Residency أو EU Residency) في ملفك الشخصي."
          : "This visa requires a valid European residency (EU or UK) in your profile.",
      };
    }
    if (euLogic === "schengen_only" && !isSchengenType) {
      return {
        eligible: false,
        reason: ar
          ? "هذه التأشيرة تتطلب تأشيرة شنغن أو بريطانية سارية في ملفك الشخصي."
          : "This visa requires a valid Schengen or UK visa in your profile.",
      };
    }
    if (euLogic === "either" && !hasAnyEuDoc) {
      return {
        eligible: false,
        reason: ar
          ? "هذه التأشيرة تتطلب إقامة أوروبية أو تأشيرة شنغن سارية في ملفك الشخصي."
          : "This visa requires a valid European residency or Schengen visa in your profile.",
      };
    }
    if (euLogic === "both" && !(isEuResidencyType && isSchengenType)) {
      return {
        eligible: false,
        reason: ar
          ? "هذه التأشيرة تتطلب إقامة أوروبية وتأشيرة شنغن معاً في ملفك الشخصي."
          : "This visa requires both a European residency and a Schengen visa in your profile.",
      };
    }
  }

  return { eligible: true };
}

// ── Helper: resolve internal storage path → base64 data URL for OpenAI ────
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".local-uploads");

async function resolveImageForOpenAI(imageUrl: string): Promise<string> {
  // Security: only internal storage object paths are accepted.
  // Arbitrary external URLs are rejected to prevent SSRF.
  if (!/^\/objects\/uploads\/[A-Za-z0-9-]+$/.test(imageUrl)) {
    throw new Error("Invalid image path");
  }

  // Internal path like /objects/uploads/<uuid> — read from local filesystem
  const uuidMatch = imageUrl.match(/\/uploads\/([^/]+)$/);
  if (uuidMatch) {
    const id = uuidMatch[1];
    try {
      const buffer = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, id));
      let mimeType = "image/jpeg";
      try { mimeType = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, `${id}.meta`), "utf8"); } catch {}
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    } catch (localErr) {
      // Not in local store; try fetching from GCS via the server's own storage route
    }
  }

  // Fallback: read directly from object storage (GCS-backed paths).
  // NOTE: we intentionally do NOT self-fetch the /api/storage/objects route —
  // that route now enforces authentication, and OCR runs server-side without a
  // user token. Reading straight from GCS keeps OCR working while the public
  // HTTP surface stays locked down.
  const objectFile = await objectStorageService.getObjectEntityFile(imageUrl);
  const [buf] = await objectFile.download();
  let mimeType = "image/jpeg";
  try {
    const [meta] = await objectFile.getMetadata();
    if (meta.contentType) mimeType = meta.contentType as string;
  } catch { /* fall back to image/jpeg */ }
  return `data:${mimeType};base64,${buf.toString("base64")}`;
}

// ── OCR endpoint ──────────────────────────────────────────────────────────
router.post("/visa-applications/ocr", requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Authorization: OCR reads the raw object server-side, so the caller must be
    // allowed to access it (owner via object_uploads, or authorized visa staff).
    // Prevents an authenticated user OCR-ing another customer's passport.
    if (!(await isAuthorizedForObject(req.user!.sub, imageUrl))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    let imageData: string;
    try {
      imageData = await resolveImageForOpenAI(imageUrl);
    } catch (e) {
      req.log.error({ err: e }, "Could not resolve passport image for OCR");
      return res.json({ success: false, error: "Could not load the passport image. Please try uploading again." });
    }

    const prompt = `You are an expert passport OCR system. Read EVERY field visible on the passport information page and the two Machine Readable Zone (MRZ) lines at the bottom.

Return ONLY a single JSON object (no markdown, no code fences) with these exact keys:
- givenName: the person's first/given name only, in English/Latin script (e.g. "JOHN")
- fatherName: the second name (father's name), English, if present
- grandName: the third name (grandfather's name), English, if present
- surname: the family/last name (surname), English (e.g. "SMITH")
- firstName: all given names combined (givenName + fatherName + grandName), English (e.g. "JOHN WILLIAM")
- lastName: same as surname
- fullNameEn: the complete name in English/Latin script, e.g. "JOHN WILLIAM SMITH"
- fullNameAr: the complete name in Arabic/native script if the passport shows one, else null
- fullName: fullNameAr if available, otherwise fullNameEn
- passportNumber: the passport/document number
- nationality: country name in English (e.g. "Yemen", "Saudi Arabia")
- gender: "male" or "female"
- dateOfBirth: YYYY-MM-DD
- issueDate: YYYY-MM-DD
- expiryDate: YYYY-MM-DD
- issuingCountry: issuing country name in English
- placeOfBirth: place of birth as printed, else null

CRITICAL RULES:
1. The MRZ (two lines of monospaced text at the very bottom, containing '<' filler characters) is the SOURCE OF TRUTH. Cross-check surname, given names, passport number, nationality, date of birth, sex and expiry date against the MRZ. When the printed field and the MRZ disagree, trust the MRZ.
2. In the MRZ the format is: line 1 "P<ISSUINGCOUNTRY<SURNAME<<GIVEN<NAMES", line 2 "PASSPORTNO<NATIONALITY<YYMMDD(dob)<SEX<YYMMDD(expiry)...". Parse names by splitting on '<' (surname is before the '<<', given names after). Convert MRZ 2-digit years correctly (dob years > current 2-digit year → 1900s).
3. NEVER guess or hallucinate. If a field is genuinely unreadable or absent, return null for it.
4. Use ISO YYYY-MM-DD for all dates.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData, detail: "high" } },
          ],
        },
      ],
      max_tokens: 900,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const jsonText = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonText);

    // Normalise: derive combined name parts when the model only returned some.
    const nz = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const given = nz(data.givenName);
    const father = nz(data.fatherName);
    const grand = nz(data.grandName);
    const surname = nz(data.surname) ?? nz(data.lastName);
    const combinedGiven = [given, father, grand].filter(Boolean).join(" ") || nz(data.firstName);

    const normalized = {
      fullName: nz(data.fullName) ?? nz(data.fullNameEn),
      fullNameEn: nz(data.fullNameEn),
      fullNameAr: nz(data.fullNameAr),
      givenName: given,
      fatherName: father,
      grandName: grand,
      surname,
      firstName: combinedGiven,
      lastName: surname,
      passportNumber: nz(data.passportNumber),
      nationality: nz(data.nationality),
      gender: nz(data.gender),
      dateOfBirth: nz(data.dateOfBirth),
      issueDate: nz(data.issueDate),
      expiryDate: nz(data.expiryDate),
      issuingCountry: nz(data.issuingCountry),
      placeOfBirth: nz(data.placeOfBirth),
    };

    // Only report success when a meaningful extraction actually happened —
    // at minimum the passport number plus some identity data.
    const hasIdentity = !!(normalized.fullNameEn || normalized.fullName || (normalized.firstName && normalized.lastName));
    if (!normalized.passportNumber || !hasIdentity) {
      req.log.warn({ extractedKeys: Object.keys(normalized).filter((k) => (normalized as Record<string, unknown>)[k]) }, "OCR returned insufficient data");
      return res.json({ success: false, error: "We couldn't read the passport. Please upload a clear image of the passport information page." });
    }

    // Log only non-PII metadata — never names, DOB, nationality, or other
    // passport contents (application logs are not a place for identity data).
    req.log.info(
      { extractedFieldCount: Object.values(normalized).filter(Boolean).length },
      "OCR success",
    );
    res.json({ success: true, ...normalized });
  } catch (e) {
    req.log.error({ err: e }, "OCR processing failed");
    res.json({ success: false, error: "We couldn't read the passport. Please upload a clear image of the passport information page." });
  }
});

// ── Photo validation endpoint ──────────────────────────────────────────────
router.post("/visa-applications/validate-photo", requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const ar = req.headers["x-lang"] === "ar";

    // Same authorization gate as OCR — reads the raw object server-side.
    if (!(await isAuthorizedForObject(req.user!.sub, imageUrl))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    let imageData: string;
    try {
      imageData = await resolveImageForOpenAI(imageUrl);
    } catch {
      // Service failure, NOT a photo rejection — use 503 so clients can
      // distinguish "couldn't check" from "checked and rejected".
      return res.status(503).json({
        error: ar ? "تعذر تحميل الصورة للتحقق. حاول مرة أخرى." : "Could not load the photo for verification. Please try again.",
      });
    }

    const reasonLang = req.headers["x-lang"] === "ar" ? "Arabic" : "English";
    const prompt = `Analyze this image for use as a passport/ID photo. Return ONLY a JSON object with:
- valid: true or false
- reason: short explanation (in ${reasonLang}) if invalid, or "Photo accepted" if valid
- faceDetected: true or false
- singleFace: true or false (true if exactly one face)

Accept the photo if: exactly one face, face clearly visible, no severe blur, face reasonably framed. Be lenient — only reject obvious issues. Return only valid JSON, no markdown.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData, detail: "low" } },
          ],
        },
      ],
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const jsonText = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonText);
    res.json(data);
  } catch (e) {
    req.log.error({ err: e }, "Photo validation failed");
    // Service failure, NOT a photo rejection — 503 keeps the two cases distinct.
    const arErr = req.headers["x-lang"] === "ar";
    res.status(503).json({
      error: arErr ? "التحقق الآلي من الصورة غير متاح مؤقتاً. حاول مرة أخرى." : "Photo validation is temporarily unavailable. Please try again.",
    });
  }
});

// ── Pre-check eligibility (authenticated) ─────────────────────────────────
router.get("/visa-applications/eligibility/:visaId", requireAuth, async (req, res) => {
  try {
    const visaId = Number(req.params.visaId);
    const ar = req.headers["x-lang"] === "ar";

    const [user] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, req.user!.sub), isNull(usersTable.deletedAt)));
    if (!user) return res.status(404).json({ error: "User not found" });

    // Profile must be complete before applying
    if (!isProfileComplete(user)) {
      return res.json({
        eligible: false,
        reason: ar
          ? "يجب إكمال ملفك الشخصي قبل التقديم على أي تأشيرة."
          : "You must complete your profile before applying for a visa.",
        profileIncomplete: true,
      });
    }

    const [visa] = await db.select().from(visasTable)
      .where(and(eq(visasTable.id, visaId), isNull(visasTable.deletedAt)));
    if (!visa) return res.status(404).json({ error: "Visa not found" });
    if (!visa.isActive || visa.status !== "available") {
      return res.json({ eligible: false, reason: ar ? "هذه التأشيرة غير متاحة حالياً." : "This visa is not currently available." });
    }

    const result = checkEligibility(user, visa, ar);
    res.json(result);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Tracking endpoint (public) ─────────────────────────────────────────────
router.get("/visa-applications/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const [row] = await db
      .select({
        id: visaApplicationSubmissionsTable.id,
        trackingNumber: visaApplicationSubmissionsTable.trackingNumber,
        status: visaApplicationSubmissionsTable.status,
        fullName: visaApplicationSubmissionsTable.fullName,
        adminNotes: visaApplicationSubmissionsTable.adminNotes,
        issuedVisaUrl: visaApplicationSubmissionsTable.issuedVisaUrl,
        createdAt: visaApplicationSubmissionsTable.createdAt,
        updatedAt: visaApplicationSubmissionsTable.updatedAt,
        visaId: visaApplicationSubmissionsTable.visaId,
      })
      .from(visaApplicationSubmissionsTable)
      .where(eq(visaApplicationSubmissionsTable.trackingNumber, trackingNumber));

    if (!row) return res.status(404).json({ error: "Tracking number not found" });

    const [visa] = await db.select({
      visaType: visasTable.visaType,
      countryAr: visasTable.countryAr,
      countryEn: visasTable.countryEn,
    }).from(visasTable).where(eq(visasTable.id, row.visaId));

    res.json({
      id: row.id,
      trackingNumber: row.trackingNumber,
      status: row.status,
      fullName: row.fullName,
      adminNotes: row.adminNotes,
      issuedVisaUrl: row.issuedVisaUrl,
      visaType: visa?.visaType ?? "",
      countryAr: visa?.countryAr ?? "",
      countryEn: visa?.countryEn ?? "",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── List applications ──────────────────────────────────────────────────────
router.get("/visa-applications", requireAuth, async (req, res) => {
  try {
    const query = ListVisaApplicationsQueryParams.parse(req.query);
    const conditions = [];
    if (query.visaId) conditions.push(eq(visaApplicationSubmissionsTable.visaId, query.visaId));
    if (query.status) conditions.push(eq(visaApplicationSubmissionsTable.status, query.status as any));
    // Admins/super_admins see all; agents see all ONLY with the visa_applications
    // permission; everyone else sees only their own applications.
    let seesAll = ["admin", "super_admin"].includes(req.user!.role);
    if (!seesAll && req.user!.role === "agent") {
      const [staff] = await db.select({ permissions: usersTable.permissions, isActive: usersTable.isActive })
        .from(usersTable).where(eq(usersTable.id, req.user!.sub));
      seesAll = !!staff?.isActive && Array.isArray(staff.permissions) && staff.permissions.includes("visa_applications");
    }
    if (!seesAll) conditions.push(eq(visaApplicationSubmissionsTable.userId, req.user!.sub));
    const rows = await db
      .select({
        app: visaApplicationSubmissionsTable,
        visaType: visasTable.visaType,
        countryAr: visasTable.countryAr,
        countryEn: visasTable.countryEn,
      })
      .from(visaApplicationSubmissionsTable)
      .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(visaApplicationSubmissionsTable.createdAt));
    res.json(rows.map(({ app, visaType, countryAr, countryEn }) => ({
      ...toResponse(app),
      visaType: visaType ?? "",
      countryAr: countryAr ?? "",
      countryEn: countryEn ?? "",
    })));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Submit application (requires auth + complete profile) ──────────────────
router.post("/visa-applications", requireAuth, async (req, res) => {
  try {
    const ar = req.headers["x-lang"] === "ar";
    const userId = req.user!.sub;

    // Load user's stored profile
    const [user] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
    if (!user) return res.status(401).json({ error: "User not found" });

    // Enforce profile completion
    if (!isProfileComplete(user)) {
      return res.status(422).json({
        error: ar
          ? "يجب إكمال ملفك الشخصي قبل التقديم على أي تأشيرة."
          : "Your profile must be complete before submitting a visa application.",
        profileIncomplete: true,
      });
    }

    const body = req.body;
    if (!body.visaId) return res.status(400).json({ error: "visaId is required" });

    // Ownership guard: any /objects/ path embedded in custom-field responses
    // must be owned by the applicant (per object_uploads). Prevents referencing
    // a victim's document to later pass the read-authorization check.
    const customValues = body.customFieldResponses && typeof body.customFieldResponses === "object"
      ? Object.values(body.customFieldResponses as Record<string, unknown>).filter((v): v is string => typeof v === "string")
      : [];
    const unownedCustom = await findUnownedObjectPath(userId, customValues);
    if (unownedCustom) {
      return res.status(403).json({ error: "You do not own the referenced document" });
    }

    const [visa] = await db.select().from(visasTable)
      .where(and(eq(visasTable.id, Number(body.visaId)), isNull(visasTable.deletedAt)));
    if (!visa) return res.status(404).json({ error: "Visa not found" });
    if (!visa.isActive || visa.status !== "available") {
      return res.status(422).json({ error: ar ? "هذه التأشيرة غير متاحة حالياً." : "This visa is not currently available." });
    }

    // Server-side eligibility check using STORED profile (cannot be bypassed)
    const eligibility = checkEligibility(user, visa, ar);
    if (!eligibility.eligible) {
      return res.status(422).json({ error: eligibility.reason });
    }

    // Determine eligibility path from stored profile
    let eligibilityPath = "direct";
    if (user.isGccResident && visa.acceptsGccResidency) eligibilityPath = "gcc";
    else if (user.isEuropeanResident && (visa.acceptsSchengenResidency || visa.acceptsUkResidency)) eligibilityPath = "alternative";

    // Generate unique application number
    let trackingNumber = generateApplicationNumber();
    let attempts = 0;
    while (attempts < 5) {
      const [existing] = await db.select({ id: visaApplicationSubmissionsTable.id })
        .from(visaApplicationSubmissionsTable)
        .where(eq(visaApplicationSubmissionsTable.trackingNumber, trackingNumber));
      if (!existing) break;
      trackingNumber = generateApplicationNumber();
      attempts++;
    }

    // Build application record from stored profile — no re-entry needed
    const insertData = {
      trackingNumber,
      visaId: Number(body.visaId),
      userId,
      eligibilityPath,
      gccCountry: user.isGccResident ? (user.gccResidenceCountry ?? null) : null,
      alternativeRegion: user.isEuropeanResident ? (user.europeanDocumentType ?? null) : null,
      // Personal info from stored profile
      fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      fullNameEn: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      nationality: user.nationality ?? "",
      gender: (user.gender as any) ?? "male",
      dateOfBirth: user.dateOfBirth ?? "",
      countryOfResidence: user.isGccResident ? (user.gccResidenceCountry ?? null) : null,
      email: user.email ?? "",
      phone: user.phone ?? "",
      // Passport from stored profile
      passportNumber: user.passportNumber ?? "",
      passportIssueDate: user.passportIssueDate ?? null,
      passportExpiryDate: user.passportExpiryDate ?? "",
      passportIssuingCountry: user.passportIssueCountry ?? null,
      passportImageUrl: user.passportImageUrl ?? null,
      personalPhotoUrl: user.profilePhotoUrl ?? null,
      // Residency docs from stored profile
      residencyImageUrl: user.gccResidenceFrontUrl ?? null,
      residencyBackImageUrl: user.gccResidenceBackUrl ?? null,
      alternativeVisaNumber: null,
      alternativeVisaExpiry: null,
      visaImageUrl: user.europeanDocumentUrl ?? null,
      // Visa-specific extras from request body
      customFieldResponses: body.customFieldResponses ?? {},
      agreedToTerms: body.agreedToTerms ?? false,
    };

    const [row] = await db.insert(visaApplicationSubmissionsTable).values(insertData as never).returning();

    // Auto-provision document slots from visa config + standard profile docs.
    // Never blocks the submission response if it fails.
    try {
      await seedApplicationDocuments({
        id: row.id,
        userId: row.userId,
        visaId: row.visaId,
        passportImageUrl: row.passportImageUrl,
        personalPhotoUrl: row.personalPhotoUrl,
        residencyImageUrl: row.residencyImageUrl,
        residencyBackImageUrl: row.residencyBackImageUrl,
        visaImageUrl: row.visaImageUrl,
      });
    } catch (seedErr) {
      req.log.error({ err: seedErr }, "Failed to seed application documents");
    }

    // Send notification (in-app row + real push to all devices)
    await notifyUser({
      userId,
      ...STATUS_MESSAGES.received,
      relatedEntityType: "visa_application",
      relatedEntityId: String(row.id),
    });

    res.status(201).json(toResponse(row));
  } catch (e: unknown) {
    req.log.error(e);
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: e });
    }
    res.status(500).json({ error: "An error occurred while processing your application. Please try again." });
  }
});

// ── Get application ────────────────────────────────────────────────────────
router.get("/visa-applications/:id", requireAuth, async (req, res) => {
  try {
    const { id } = GetVisaApplicationParams.parse({ id: Number(req.params.id) });
    const [row] = await db
      .select({
        app: visaApplicationSubmissionsTable,
        visaType: visasTable.visaType,
        countryAr: visasTable.countryAr,
        countryEn: visasTable.countryEn,
      })
      .from(visaApplicationSubmissionsTable)
      .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
      .where(eq(visaApplicationSubmissionsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    // Owner, or staff with the visa_applications permission (DB-checked).
    if (row.app.userId !== req.user!.sub && !(await hasStaffPermission(req.user!.sub, "visa_applications"))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({
      ...toResponse(row.app),
      visaType: row.visaType ?? "",
      countryAr: row.countryAr ?? "",
      countryEn: row.countryEn ?? "",
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Update application status (staff only) ─────────────────────────────────
router.patch("/visa-applications/:id", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  try {
    const { id } = UpdateVisaApplicationParams.parse({ id: Number(req.params.id) });
    const body = UpdateVisaApplicationBody.parse(req.body);

    // Load the current row so we can detect what actually changed (admin notes,
    // issued visa file) and only fire notifications for real changes.
    const [prev] = await db.select().from(visaApplicationSubmissionsTable)
      .where(eq(visaApplicationSubmissionsTable.id, id));
    if (!prev) return res.status(404).json({ error: "Not found" });

    const [row] = await db
      .update(visaApplicationSubmissionsTable)
      .set({ ...body, updatedAt: new Date() } as never)
      .where(eq(visaApplicationSubmissionsTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    // ── Client notifications ────────────────────────────────────────────────
    if (row.userId) {
      // 1. Status change → status-specific copy.
      if (body.status) {
        const copy = STATUS_MESSAGES[body.status];
        if (copy) {
          await notifyUser({
            userId: row.userId,
            ...copy,
            relatedEntityType: "visa_application",
            relatedEntityId: String(row.id),
          });
        }
      }

      // 2. Admin note added/changed (independent of status) → notify client.
      const noteChanged =
        typeof body.adminNotes === "string" &&
        body.adminNotes.trim().length > 0 &&
        body.adminNotes !== (prev.adminNotes ?? "");
      if (noteChanged) {
        await notifyUser({
          userId: row.userId,
          titleAr: "ملاحظة من الإدارة",
          titleEn: "A note from our team",
          messageAr: body.adminNotes!.slice(0, 480),
          messageEn: body.adminNotes!.slice(0, 480),
          relatedEntityType: "visa_application",
          relatedEntityId: String(row.id),
        });
      }

      // 3. Issued visa file attached/changed → notify client it's ready.
      const fileChanged =
        typeof body.issuedVisaUrl === "string" &&
        body.issuedVisaUrl.trim().length > 0 &&
        body.issuedVisaUrl !== (prev.issuedVisaUrl ?? "");
      if (fileChanged) {
        await notifyUser({
          userId: row.userId,
          titleAr: "تأشيرتك جاهزة للتحميل",
          titleEn: "Your visa is ready to download",
          messageAr: "تم إرفاق ملف تأشيرتك. يمكنك الآن تحميلها من شاشة تتبع الطلب.",
          messageEn: "Your visa document has been attached. You can now download it from the tracking screen.",
          relatedEntityType: "visa_application",
          relatedEntityId: String(row.id),
        });
      }
    }

    if (body.status) {
      logAudit(req, "visa_application.status_changed", { entityType: "visa_application", newValue: { id: row.id, status: body.status } });
    }
    if (typeof body.issuedVisaUrl === "string" && body.issuedVisaUrl !== (prev.issuedVisaUrl ?? "")) {
      logAudit(req, "visa_application.visa_file_attached", { entityType: "visa_application", newValue: { id: row.id } });
    }
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
