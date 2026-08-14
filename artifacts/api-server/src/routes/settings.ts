import { Router } from "express";
import { db, appSettingsTable } from "@workspace/db";
import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { canonicalCountryEn } from "@workspace/countries";

const router = Router();

/** Keys exposed publicly (used by the web platform for "Download the App"). */
const PUBLIC_KEYS = [
  "android_app_url",
  "ios_app_url",
  "app_landing_url",
  "support_url",
] as const;

const updateSchema = z.object({
  android_app_url: z.string().url().or(z.literal("")).optional(),
  ios_app_url: z.string().url().or(z.literal("")).optional(),
  app_landing_url: z.string().url().or(z.literal("")).optional(),
  support_url: z.string().url().or(z.literal("")).optional(),
});

// ── Umrah settings ──────────────────────────────────────────────────────────
export const UMRAH_KEYS = [
  "umrah_declaration_ar",
  "umrah_declaration_en",
  "umrah_fees",
] as const;

export interface UmrahFees {
  default: number;
  currency: string;
  byNationality: Record<string, number>;
}

export const DEFAULT_UMRAH_FEES: UmrahFees = {
  default: 490,
  currency: "SAR",
  byNationality: {},
};

/** Seed copy for the Umrah declaration (Arabic). Editable from the dashboard. */
const DEFAULT_UMRAH_DECLARATION_AR = `إقرار وتعهد تأشيرة العمرة

أقر أنا مقدم الطلب (المعتمر) بأنني اطلعت وفهمت جميع الأنظمة والتعليمات المتعلقة بأداء مناسك العمرة في المملكة العربية السعودية، وأتعهد بالالتزام بها التزاماً كاملاً.

كما أقر بأن المعتمر والمستضيف مسؤولان مسؤولية مشتركة وكاملة عن الالتزام بأنظمة وتعليمات العمرة والأنظمة المعمول بها في المملكة العربية السعودية، بما في ذلك مواعيد الدخول والخروج وعدم تجاوز مدة التأشيرة والالتزام بالأماكن المصرح بها.

وأتعهد بصحة جميع البيانات والمستندات المقدمة، وأتحمل كامل المسؤولية القانونية عن أي معلومات غير صحيحة.

تحذير هام بالجزاءات:
في حال مخالفة أنظمة وتعليمات العمرة أو تجاوز مدة التأشيرة أو مخالفة أي من الأنظمة المعمول بها في المملكة العربية السعودية، يتعرض المخالف والمستضيف للعقوبات المقررة نظاماً، والتي قد تصل إلى غرامة مالية تبلغ خمسين ألف ريال سعودي (50,000 ريال) والسجن وفق النص القانوني المعتمد، إضافة إلى الترحيل والمنع من دخول المملكة.

أقر بأنني قرأت ووافقت على إقرار وتعهد تأشيرة العمرة.`;

/** English translation of the Umrah declaration. Editable from the dashboard. */
const DEFAULT_UMRAH_DECLARATION_EN = `Umrah Visa Declaration and Undertaking

I, the applicant (pilgrim), acknowledge that I have read and understood all regulations and instructions related to performing Umrah in the Kingdom of Saudi Arabia, and I undertake to fully comply with them.

I further acknowledge that both the pilgrim and the host (sponsor) bear joint and full responsibility for complying with the Umrah regulations and instructions and the laws in force in the Kingdom of Saudi Arabia, including entry and exit dates, not overstaying the visa validity, and adhering to authorized locations.

I confirm that all data and documents submitted are true and correct, and I bear full legal responsibility for any incorrect information.

Important warning of penalties:
In the event of violating the Umrah regulations and instructions, overstaying the visa validity, or breaching any of the laws in force in the Kingdom of Saudi Arabia, the violator and the host are subject to the statutory penalties, which may reach a financial fine of up to fifty thousand Saudi Riyals (SAR 50,000) and imprisonment in accordance with the applicable legal text, in addition to deportation and a ban from entering the Kingdom.

I acknowledge that I have read and agreed to the Umrah Visa Declaration and Undertaking.`;

/** Parse the stored umrah_fees JSON, falling back to defaults on any error. */
function parseUmrahFees(raw: string | undefined): UmrahFees {
  if (!raw) return DEFAULT_UMRAH_FEES;
  try {
    const parsed = JSON.parse(raw) as Partial<UmrahFees>;
    return {
      default: typeof parsed.default === "number" ? parsed.default : DEFAULT_UMRAH_FEES.default,
      currency: typeof parsed.currency === "string" ? parsed.currency : DEFAULT_UMRAH_FEES.currency,
      byNationality:
        parsed.byNationality && typeof parsed.byNationality === "object"
          ? (parsed.byNationality as Record<string, number>)
          : {},
    };
  } catch {
    return DEFAULT_UMRAH_FEES;
  }
}

/** Load the current Umrah settings, applying seeded defaults for missing keys. */
export async function getUmrahSettings(): Promise<{
  declarationAr: string;
  declarationEn: string;
  fees: UmrahFees;
}> {
  const rows = await db.select().from(appSettingsTable)
    .where(inArray(appSettingsTable.key, [...UMRAH_KEYS]));
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    declarationAr: map["umrah_declaration_ar"] || DEFAULT_UMRAH_DECLARATION_AR,
    declarationEn: map["umrah_declaration_en"] || DEFAULT_UMRAH_DECLARATION_EN,
    fees: parseUmrahFees(map["umrah_fees"]),
  };
}

/**
 * Resolve the Umrah fee for a nationality: byNationality[canonical] ?? default.
 * Nationality keys are stored as canonical English country names.
 */
export function resolveUmrahFee(fees: UmrahFees, nationality?: string | null): { amount: number; currency: string } {
  const canonical = canonicalCountryEn(nationality) ?? (nationality ?? "").trim();
  const byNat = fees.byNationality ?? {};
  // Prefer exact canonical key; also try the canonical of each stored key so
  // legacy free-text keys ("UAE") still resolve.
  if (canonical && Object.prototype.hasOwnProperty.call(byNat, canonical)) {
    return { amount: byNat[canonical], currency: fees.currency };
  }
  for (const [k, v] of Object.entries(byNat)) {
    if (canonicalCountryEn(k) && canonical && canonicalCountryEn(k) === canonical) {
      return { amount: v, currency: fees.currency };
    }
  }
  return { amount: fees.default, currency: fees.currency };
}

// GET /api/settings/public — no auth; only whitelisted keys
router.get("/settings/public", async (req, res) => {
  try {
    const rows = await db.select().from(appSettingsTable)
      .where(inArray(appSettingsTable.key, [...PUBLIC_KEYS]));
    const out: Record<string, string> = {};
    for (const k of PUBLIC_KEYS) out[k] = "";
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/settings/app-links — staff with settings permission
router.get("/settings/app-links", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    const rows = await db.select().from(appSettingsTable)
      .where(inArray(appSettingsTable.key, [...PUBLIC_KEYS]));
    const out: Record<string, string> = {};
    for (const k of PUBLIC_KEYS) out[k] = "";
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/settings/app-links
router.put("/settings/app-links", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    const body = updateSchema.parse(req.body);
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue;
      await db.insert(appSettingsTable)
        .values({ key, value, updatedBy: req.user!.sub })
        .onConflictDoUpdate({
          target: appSettingsTable.key,
          set: { value, updatedBy: req.user!.sub, updatedAt: sql`now()` },
        });
    }
    logAudit(req, "settings.app_links_updated", { entityType: "app_settings", newValue: body });
    const rows = await db.select().from(appSettingsTable)
      .where(inArray(appSettingsTable.key, [...PUBLIC_KEYS]));
    const out: Record<string, string> = {};
    for (const k of PUBLIC_KEYS) out[k] = "";
    for (const r of rows) out[r.key] = r.value;
    res.json(out);
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Umrah settings (staff) ────────────────────────────────────────────────
const umrahSettingsUpdateSchema = z.object({
  umrah_declaration_ar: z.string().optional(),
  umrah_declaration_en: z.string().optional(),
  // umrah_fees may be supplied as an object or a JSON string.
  umrah_fees: z
    .union([
      z.string(),
      z.object({
        default: z.number(),
        currency: z.string(),
        byNationality: z.record(z.string(), z.number()).default({}),
      }),
    ])
    .optional(),
});

// GET /api/settings/umrah — staff with settings permission
router.get("/settings/umrah", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    const { declarationAr, declarationEn, fees } = await getUmrahSettings();
    res.json({
      umrah_declaration_ar: declarationAr,
      umrah_declaration_en: declarationEn,
      umrah_fees: fees,
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/settings/umrah — staff with settings permission
router.put("/settings/umrah", requireAuth, requirePermission("settings"), async (req, res) => {
  try {
    const body = umrahSettingsUpdateSchema.parse(req.body);
    const writes: Array<{ key: string; value: string }> = [];
    if (body.umrah_declaration_ar !== undefined)
      writes.push({ key: "umrah_declaration_ar", value: body.umrah_declaration_ar });
    if (body.umrah_declaration_en !== undefined)
      writes.push({ key: "umrah_declaration_en", value: body.umrah_declaration_en });
    if (body.umrah_fees !== undefined) {
      const value = typeof body.umrah_fees === "string" ? body.umrah_fees : JSON.stringify(body.umrah_fees);
      // Validate parseability so we never persist a broken fees blob.
      parseUmrahFees(value);
      writes.push({ key: "umrah_fees", value });
    }
    for (const { key, value } of writes) {
      await db.insert(appSettingsTable)
        .values({ key, value, updatedBy: req.user!.sub })
        .onConflictDoUpdate({
          target: appSettingsTable.key,
          set: { value, updatedBy: req.user!.sub, updatedAt: sql`now()` },
        });
    }
    logAudit(req, "settings.umrah_updated", { entityType: "app_settings", newValue: { keys: writes.map((w) => w.key) } });
    const { declarationAr, declarationEn, fees } = await getUmrahSettings();
    res.json({
      umrah_declaration_ar: declarationAr,
      umrah_declaration_en: declarationEn,
      umrah_fees: fees,
    });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/umrah/config — authenticated customer; returns declaration + fee.
// Fee resolution given ?nationality=: byNationality[canonical] ?? default.
router.get("/umrah/config", requireAuth, async (req, res) => {
  try {
    const { declarationAr, declarationEn, fees } = await getUmrahSettings();
    const nationality = typeof req.query.nationality === "string" ? req.query.nationality : undefined;
    const out: {
      declarationAr: string;
      declarationEn: string;
      feeForNationality?: { amount: number; currency: string };
    } = { declarationAr, declarationEn };
    if (nationality) out.feeForNationality = resolveUmrahFee(fees, nationality);
    res.json(out);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
