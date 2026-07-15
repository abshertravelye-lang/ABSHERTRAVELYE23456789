import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { requireAuth, requireRole } from "../middleware/auth";
import { CreateEmployeeBody, UpdateEmployeeParams, UpdateEmployeeBody } from "@workspace/api-zod";

const router = Router();

const STAFF_ROLES = ["agent", "admin", "super_admin"] as const;

const toResponse = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  email: u.email,
  phone: u.phone,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  isActive: u.isActive,
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
});

// Only admin/super_admin can view the staff list; only super_admin can create or change roles.
router.get("/employees", requireAuth, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(usersTable)
      .where(and(inArray(usersTable.role, STAFF_ROLES), isNull(usersTable.deletedAt)))
      .orderBy(desc(usersTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/employees", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    const body = CreateEmployeeBody.parse(req.body);
    if (!body.email && !body.phone) {
      return res.status(400).json({ error: "Email or phone is required" });
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(usersTable).values({
      email: body.email,
      phone: body.phone,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
    }).returning();
    res.status(201).json(toResponse(user));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/employees/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
  try {
    const { id } = UpdateEmployeeParams.parse({ id: req.params.id });
    const body = UpdateEmployeeBody.parse(req.body);
    const [row] = await db
      .update(usersTable)
      .set(body)
      .where(and(eq(usersTable.id, id), inArray(usersTable.role, STAFF_ROLES)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
