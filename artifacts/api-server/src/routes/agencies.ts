import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  agenciesTable,
  agencyVisaServicesTable,
  usersTable,
  userSessionsTable,
  visasTable,
  visaApplicationSubmissionsTable,
} from "@workspace/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { notifyUser } from "../lib/notify";

const router = Router();

// ── Permissions used by this module ─────────────────────────────────────────
//  - "employees": manage agencies + agent user accounts (create/reset password).
//    Chosen because it already governs user-account lifecycle (create employee,
//    reset passwords) and agent accounts are just role="agent" users.
//  - "visa_applications": view/process agent applications + view applicant docs,
//    reusing the exact same permission already gating visa-application review.

// ─────────────────────────────────────────────────────────────────────────────
// Serializers
// ─────────────────────────────────────────────────────────────────────────────
const agencyToResponse = (a: typeof agenciesTable.$inferSelect) => ({
  id: a.id,
  name: a.name,
  contactEmail: a.contactEmail,
  contactPhone: a.contactPhone,
  address: a.address,
  notes: a.notes,
  status: a.status,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

const agentToResponse = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  agencyId: u.agencyId,
  isActive: u.isActive,
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
});

const serviceToResponse = (s: typeof agencyVisaServicesTable.$inferSelect) => ({
  id: s.id,
  agencyId: s.agencyId,
  visaId: s.visaId,
  enabled: s.enabled,
  agentPrice: s.agentPrice,
  currency: s.currency,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────
const createAgencySchema = z.object({
  name: z.string().min(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
});

const updateAgencySchema = z.object({
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
});

const createAgentSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

const putServicesSchema = z.object({
  services: z.array(z.object({
    visaId: z.number().int().positive(),
    enabled: z.boolean(),
    agentPrice: z.union([z.number(), z.string()]),
    currency: z.string().optional(),
  })),
});

const listAppsQuery = z.object({
  agencyId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

// ═════════════════════════════════════════════════════════════════════════════
// AGENCIES CRUD  (permission: employees)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/agencies — list all agencies
router.get("/agencies", requireAuth, requirePermission("employees"), async (_req, res) => {
  const rows = await db.select().from(agenciesTable).orderBy(desc(agenciesTable.createdAt));
  res.json(rows.map(agencyToResponse));
});

// GET /api/agencies/:id — agency detail
router.get("/agencies/:id", requireAuth, requirePermission("employees"), async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(agencyToResponse(row));
});

// POST /api/agencies — create agency
router.post("/agencies", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const body = createAgencySchema.parse(req.body);
    const [row] = await db.insert(agenciesTable).values({
      name: body.name,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      address: body.address,
      notes: body.notes,
      status: (body.status ?? "pending") as any,
    } as any).returning();
    logAudit(req, "agency.created", { entityType: "agency", entityId: String(row.id), newValue: { name: row.name, status: row.status } });
    res.status(201).json(agencyToResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(400).json({ error: "Invalid input" });
  }
});

// PATCH /api/agencies/:id — edit agency info + status (activate/suspend/pending)
router.patch("/agencies/:id", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = updateAgencySchema.parse(req.body);
    const [old] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, id));
    if (!old) return res.status(404).json({ error: "Not found" });
    const [row] = await db.update(agenciesTable)
      .set({ ...body, updatedAt: new Date() } as any)
      .where(eq(agenciesTable.id, id))
      .returning();

    // Suspending an agency revokes all its agents' sessions immediately.
    if (body.status && body.status !== "active" && old.status === "active") {
      const agents = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.agencyId, id));
      const ids = agents.map((a) => a.id);
      for (const uid of ids) {
        await db.update(userSessionsTable).set({ revokedAt: new Date() }).where(eq(userSessionsTable.userId, uid));
      }
    }

    logAudit(req, "agency.updated", {
      entityType: "agency", entityId: String(id),
      oldValue: { status: old.status }, newValue: { status: row.status },
    });
    res.json(agencyToResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// AGENT ACCOUNTS  (permission: employees)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/agencies/:id/agents — list an agency's agent accounts
router.get("/agencies/:id/agents", requireAuth, requirePermission("employees"), async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db.select().from(usersTable)
    .where(and(eq(usersTable.agencyId, id), eq(usersTable.role, "agent" as any), isNull(usersTable.deletedAt)))
    .orderBy(desc(usersTable.createdAt));
  res.json(rows.map(agentToResponse));
});

// POST /api/agencies/:id/agents — create an agent account for the agency
router.post("/agencies/:id/agents", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const agencyId = Number(req.params.id);
    const [agency] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, agencyId));
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    const body = createAgentSchema.parse(req.body);

    if (body.email) {
      const [dupe] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.email, body.email), isNull(usersTable.deletedAt)));
      if (dupe) return res.status(409).json({ error: "Email already registered" });
    }
    if (body.phone) {
      const [dupe] = await db.select({ id: usersTable.id }).from(usersTable)
        .where(and(eq(usersTable.phone, body.phone), isNull(usersTable.deletedAt)));
      if (dupe) return res.status(409).json({ error: "Phone already registered" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(usersTable).values({
      email: body.email,
      phone: body.phone,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: "agent" as any,
      agencyId,
      // Agent-portal accounts hold NO admin permissions — they must never
      // reach the admin dashboard; access is scoped by requireAgent + agency_id.
      permissions: [],
    } as any).returning();

    logAudit(req, "agent.created", { entityType: "user", entityId: user.id, newValue: { agencyId } });
    res.status(201).json(agentToResponse(user));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(400).json({ error: "Invalid input" });
  }
});

// POST /api/agents/:agentId/reset-password — reset an agent's password
router.post("/agents/:agentId/reset-password", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const agentId = z.string().uuid().parse(req.params.agentId);
    const body = resetPasswordSchema.parse(req.body);
    const [agent] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, agentId), eq(usersTable.role, "agent" as any), isNull(usersTable.deletedAt)));
    if (!agent || agent.agencyId == null) return res.status(404).json({ error: "Agent not found" });

    const passwordHash = await bcrypt.hash(body.password, 12);
    await db.update(usersTable).set({ passwordHash, updatedAt: new Date() } as any).where(eq(usersTable.id, agentId));
    // Revoke existing sessions so the old password stops working everywhere.
    await db.update(userSessionsTable).set({ revokedAt: new Date() }).where(eq(userSessionsTable.userId, agentId));

    logAudit(req, "agent.password_reset", { entityType: "user", entityId: agentId });
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/agents/:agentId — activate/deactivate an agent account
router.patch("/agents/:agentId", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const agentId = z.string().uuid().parse(req.params.agentId);
    const body = z.object({ isActive: z.boolean().optional(), firstName: z.string().min(1).optional(), lastName: z.string().optional() }).parse(req.body);
    const [agent] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, agentId), eq(usersTable.role, "agent" as any), isNull(usersTable.deletedAt)));
    if (!agent || agent.agencyId == null) return res.status(404).json({ error: "Agent not found" });
    const [row] = await db.update(usersTable).set({ ...body, updatedAt: new Date() } as any).where(eq(usersTable.id, agentId)).returning();
    if (body.isActive === false) {
      await db.update(userSessionsTable).set({ revokedAt: new Date() }).where(eq(userSessionsTable.userId, agentId));
    }
    logAudit(req, "agent.updated", { entityType: "user", entityId: agentId });
    res.json(agentToResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// AGENCY VISA SERVICES & PRICING  (permission: employees)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/agencies/:id/visa-services — configured services for the agency
router.get("/agencies/:id/visa-services", requireAuth, requirePermission("employees"), async (req, res) => {
  const agencyId = Number(req.params.id);
  const rows = await db.select().from(agencyVisaServicesTable)
    .where(eq(agencyVisaServicesTable.agencyId, agencyId));
  res.json(rows.map(serviceToResponse));
});

// PUT /api/agencies/:id/visa-services — upsert the agency's visa services & prices
router.put("/agencies/:id/visa-services", requireAuth, requirePermission("employees"), async (req, res) => {
  try {
    const agencyId = Number(req.params.id);
    const [agency] = await db.select().from(agenciesTable).where(eq(agenciesTable.id, agencyId));
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    const body = putServicesSchema.parse(req.body);

    for (const svc of body.services) {
      // Validate visa exists (and is not soft-deleted).
      const [visa] = await db.select({ id: visasTable.id }).from(visasTable)
        .where(and(eq(visasTable.id, svc.visaId), isNull(visasTable.deletedAt)));
      if (!visa) return res.status(422).json({ error: `Visa ${svc.visaId} not found` });

      const agentPrice = String(svc.agentPrice);
      await db.insert(agencyVisaServicesTable).values({
        agencyId,
        visaId: svc.visaId,
        enabled: svc.enabled,
        agentPrice: agentPrice as any,
        currency: svc.currency ?? "SAR",
      } as any).onConflictDoUpdate({
        target: [agencyVisaServicesTable.agencyId, agencyVisaServicesTable.visaId],
        set: {
          enabled: svc.enabled,
          agentPrice: agentPrice as any,
          currency: svc.currency ?? "SAR",
          updatedAt: new Date(),
        } as any,
      });
    }

    const rows = await db.select().from(agencyVisaServicesTable)
      .where(eq(agencyVisaServicesTable.agencyId, agencyId));
    logAudit(req, "agency.visa_services_updated", { entityType: "agency", entityId: String(agencyId) });
    res.json(rows.map(serviceToResponse));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN — AGENT APPLICATIONS  (permission: visa_applications)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/agent-applications — all agent applications (all agencies), filterable
router.get("/agent-applications", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  try {
    const q = listAppsQuery.parse(req.query);
    const conditions = [sql`${visaApplicationSubmissionsTable.agencyId} IS NOT NULL`];
    if (q.agencyId) conditions.push(eq(visaApplicationSubmissionsTable.agencyId, q.agencyId));
    if (q.status) conditions.push(eq(visaApplicationSubmissionsTable.status, q.status as any));

    const rows = await db.select({
      app: visaApplicationSubmissionsTable,
      agencyName: agenciesTable.name,
      agentFirstName: usersTable.firstName,
      agentLastName: usersTable.lastName,
      visaType: visasTable.visaType,
      countryEn: visasTable.countryEn,
      countryAr: visasTable.countryAr,
    })
      .from(visaApplicationSubmissionsTable)
      .leftJoin(agenciesTable, eq(agenciesTable.id, visaApplicationSubmissionsTable.agencyId))
      .leftJoin(usersTable, eq(usersTable.id, visaApplicationSubmissionsTable.submittedByAgentId))
      .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
      .where(and(...conditions))
      .orderBy(desc(visaApplicationSubmissionsTable.createdAt));

    res.json(rows.map((r) => ({
      ...r.app,
      createdAt: r.app.createdAt.toISOString(),
      updatedAt: r.app.updatedAt.toISOString(),
      agencyName: r.agencyName,
      agentName: `${r.agentFirstName ?? ""} ${r.agentLastName ?? ""}`.trim() || null,
      visaType: r.visaType,
      countryEn: r.countryEn,
      countryAr: r.countryAr,
    })));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/agent-applications/:id — one agent application (detail)
router.get("/agent-applications/:id", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select({
    app: visaApplicationSubmissionsTable,
    agencyName: agenciesTable.name,
    agentFirstName: usersTable.firstName,
    agentLastName: usersTable.lastName,
    visaType: visasTable.visaType,
    countryEn: visasTable.countryEn,
    countryAr: visasTable.countryAr,
  })
    .from(visaApplicationSubmissionsTable)
    .leftJoin(agenciesTable, eq(agenciesTable.id, visaApplicationSubmissionsTable.agencyId))
    .leftJoin(usersTable, eq(usersTable.id, visaApplicationSubmissionsTable.submittedByAgentId))
    .leftJoin(visasTable, eq(visasTable.id, visaApplicationSubmissionsTable.visaId))
    .where(eq(visaApplicationSubmissionsTable.id, id));
  if (!row || row.app.agencyId == null) return res.status(404).json({ error: "Not found" });
  res.json({
    ...row.app,
    createdAt: row.app.createdAt.toISOString(),
    updatedAt: row.app.updatedAt.toISOString(),
    agencyName: row.agencyName,
    agentName: `${row.agentFirstName ?? ""} ${row.agentLastName ?? ""}`.trim() || null,
    visaType: row.visaType,
    countryEn: row.countryEn,
    countryAr: row.countryAr,
  });
});

// ── Status notification copy for the agent ──────────────────────────────────
const AGENT_STATUS_MESSAGES: Record<string, { titleAr: string; titleEn: string; messageAr: string; messageEn: string }> = {
  received: { titleAr: "تم استلام الطلب", titleEn: "Application received", messageAr: "تم استلام طلب التأشيرة.", messageEn: "The visa application has been received." },
  under_review: { titleAr: "الطلب قيد المراجعة", titleEn: "Under review", messageAr: "طلب التأشيرة قيد المراجعة الآن.", messageEn: "The visa application is now under review." },
  awaiting_documents: { titleAr: "بانتظار مستندات إضافية", titleEn: "Additional documents required", messageAr: "مطلوب مستندات إضافية لاستكمال الطلب.", messageEn: "Additional documents are required to continue." },
  documents_uploaded: { titleAr: "تم رفع المستندات", titleEn: "Documents uploaded", messageAr: "تم استلام المستندات وسيستكمل الطلب.", messageEn: "Documents received; processing will continue." },
  sent_to_embassy: { titleAr: "تم الإرسال للسفارة", titleEn: "Sent to embassy", messageAr: "تم إرسال الطلب إلى السفارة.", messageEn: "The application has been sent to the embassy." },
  processing: { titleAr: "الطلب قيد المعالجة", titleEn: "Processing", messageAr: "يتم معالجة الطلب حالياً.", messageEn: "The application is being processed." },
  issued: { titleAr: "تم إصدار التأشيرة", titleEn: "Visa issued", messageAr: "تم إصدار التأشيرة بنجاح.", messageEn: "The visa has been issued successfully." },
  completed: { titleAr: "اكتمل الطلب", titleEn: "Application completed", messageAr: "تم إكمال الطلب بنجاح.", messageEn: "The application has been completed." },
  rejected: { titleAr: "تم رفض الطلب", titleEn: "Application rejected", messageAr: "نأسف، تم رفض الطلب. يرجى التواصل معنا.", messageEn: "The application was rejected. Please contact us." },
  cancelled: { titleAr: "تم إلغاء الطلب", titleEn: "Application cancelled", messageAr: "تم إلغاء الطلب.", messageEn: "The application has been cancelled." },
};

const patchAppSchema = z.object({
  status: z.enum([
    "received", "under_review", "awaiting_documents", "documents_uploaded",
    "sent_to_embassy", "processing", "issued", "completed", "rejected", "cancelled",
  ]).optional(),
  adminNotes: z.string().optional(),
  issuedVisaUrl: z.string().optional(),
});

// PATCH /api/agent-applications/:id — update status / notes; notify the AGENT
router.patch("/agent-applications/:id", requireAuth, requirePermission("visa_applications"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = patchAppSchema.parse(req.body);

    const [prev] = await db.select().from(visaApplicationSubmissionsTable)
      .where(eq(visaApplicationSubmissionsTable.id, id));
    if (!prev || prev.agencyId == null) return res.status(404).json({ error: "Not found" });

    const [row] = await db.update(visaApplicationSubmissionsTable)
      .set({ ...body, updatedAt: new Date() } as any)
      .where(eq(visaApplicationSubmissionsTable.id, id))
      .returning();

    // Notify the submitting agent (in-app + push) with a deep link to the portal.
    if (row.submittedByAgentId && body.status) {
      const copy = AGENT_STATUS_MESSAGES[body.status];
      if (copy) {
        await notifyUser({
          userId: row.submittedByAgentId,
          ...copy,
          relatedEntityType: "agent_application",
          relatedEntityId: String(row.id),
          url: "/agent",
        });
      }
    }

    if (body.status) {
      logAudit(req, "agent_application.status_changed", { entityType: "visa_application", entityId: String(row.id), newValue: { status: body.status } });
    }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
