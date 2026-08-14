import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userSessionsTable } from "@workspace/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requirePermission, requireSuperAdmin, hasStaffPermission } from "../middleware/auth";
import { PERMISSIONS, STAFF_ROLES, ROLE_PRESETS } from "../lib/permissions";
import { logAudit } from "../lib/audit";

const router = Router();

const permissionEnum = z.enum(PERMISSIONS);

const createSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  role: z.enum(["agent", "admin", "super_admin"]).default("agent"),
  preset: z.string().optional(), // visa_employee | support_employee | flight_employee | hotel_employee | custom
  permissions: z.array(permissionEnum).optional(),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

const updateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  role: z.enum(["agent", "admin", "super_admin"]).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(permissionEnum).optional(),
  password: z.string().min(8).optional(), // password reset
});

const toResponse = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  firstName: u.firstName,
  lastName: u.lastName,
  profilePhotoUrl: u.profilePhotoUrl,
  role: u.role,
  isActive: u.isActive,
  permissions: u.permissions ?? [],
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
});

// GET /api/employees — staff with employees permission (admins/super_admin always)
router.get("/employees", requireAuth, async (req, res) => {
  try {
    const { all } = req.query;
    // all=true returns ALL users (customer listing) -> requires "customers";
    // staff-only listing -> requires "employees".
    const needed = all === "true" ? ("customers" as const) : ("employees" as const);
    if (!(await hasStaffPermission(req.user!.sub, needed))) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    const rows = await db
      .select()
      .from(usersTable)
      .where(
        all === "true"
          ? isNull(usersTable.deletedAt)
          : and(inArray(usersTable.role, STAFF_ROLES), isNull(usersTable.deletedAt))
      )
      .orderBy(desc(usersTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/employees/permissions — available permission keys + presets
router.get("/employees/permissions", requireAuth, requirePermission("employees"), async (_req, res) => {
  res.json({ permissions: PERMISSIONS, presets: ROLE_PRESETS });
});

// POST /api/employees — super_admin only
router.post("/employees", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const body = createSchema.parse(req.body);
    const permissions = body.permissions
      ?? (body.preset && ROLE_PRESETS[body.preset] ? ROLE_PRESETS[body.preset] : []);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(usersTable).values({
      email: body.email,
      phone: body.phone,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      profilePhotoUrl: body.profilePhotoUrl,
      role: body.role,
      permissions,
    }).returning();
    logAudit(req, "employee.created", { entityType: "user", entityId: user.id, newValue: { role: user.role, permissions } });
    res.status(201).json(toResponse(user));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(400).json({ error: "Invalid input" });
  }
});

// PATCH /api/employees/:id — super_admin only (edit, permissions, activate/deactivate, password reset)
router.patch("/employees/:id", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const body = updateSchema.parse(req.body);

    // A super admin cannot deactivate or demote themselves (avoids lockout)
    if (id === req.user!.sub && (body.isActive === false || (body.role && body.role !== "super_admin"))) {
      return res.status(400).json({ error: "You cannot deactivate or demote your own account" });
    }

    const { password, ...rest } = body;
    const update: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) update.passwordHash = await bcrypt.hash(password, 12);

    const [old] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, id), inArray(usersTable.role, STAFF_ROLES), isNull(usersTable.deletedAt)));
    if (!old) return res.status(404).json({ error: "Not found" });

    const [row] = await db
      .update(usersTable)
      .set(update as never)
      .where(eq(usersTable.id, id))
      .returning();

    // Deactivation revokes all sessions immediately
    if (body.isActive === false) {
      await db.update(userSessionsTable)
        .set({ revokedAt: new Date() })
        .where(eq(userSessionsTable.userId, id));
    }

    logAudit(req, body.password ? "employee.password_reset" : body.isActive === false ? "employee.deactivated" : body.permissions ? "employee.permissions_changed" : "employee.updated", {
      entityType: "user",
      entityId: id,
      oldValue: { role: old.role, isActive: old.isActive, permissions: old.permissions },
      newValue: { role: row.role, isActive: row.isActive, permissions: row.permissions },
    });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/employees/:id — super_admin only (soft delete)
router.delete("/employees/:id", requireAuth, requireSuperAdmin(), async (req, res) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    if (id === req.user!.sub) return res.status(400).json({ error: "You cannot delete your own account" });
    const [row] = await db.update(usersTable)
      .set({ deletedAt: new Date(), isActive: false })
      .where(and(eq(usersTable.id, id), inArray(usersTable.role, STAFF_ROLES), isNull(usersTable.deletedAt)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    await db.update(userSessionsTable)
      .set({ revokedAt: new Date() })
      .where(eq(userSessionsTable.userId, id));
    logAudit(req, "employee.deleted", { entityType: "user", entityId: id });
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
