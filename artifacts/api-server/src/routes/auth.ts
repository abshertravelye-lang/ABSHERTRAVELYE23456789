import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userSessionsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { createHash } from "crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { logAudit } from "../lib/audit";
import { canonicalCountryEn } from "@workspace/countries";
import { findUnownedObjectPath } from "../lib/objectAccess";

const router = Router();

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  nationality: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Compute whether a user profile is "100% complete" per business rules. */
export function isProfileComplete(user: typeof usersTable.$inferSelect): boolean {
  // Core personal info
  if (!user.firstName && !user.lastName) return false;
  if (!user.nationality) return false;
  if (!user.dateOfBirth) return false;
  if (!user.gender) return false;
  if (!user.phone) return false;
  // Photo
  if (!user.profilePhotoUrl) return false;
  // Passport
  if (!user.passportNumber) return false;
  if (!user.passportExpiryDate) return false;
  if (!user.passportImageUrl) return false;
  // GCC — if resident, must have country and front image
  if (user.isGccResident) {
    if (!user.gccResidenceCountry) return false;
    if (!user.gccResidenceFrontUrl) return false;
  }
  // European — if resident/holder, must have document URL
  if (user.isEuropeanResident) {
    if (!user.europeanDocumentUrl) return false;
  }
  return true;
}

function safeUser(user: typeof usersTable.$inferSelect) {
  const {
    passwordHash: _,
    deletedAt: __,
    emailVerifyToken: ___,
    phoneOtp: ____,
    phoneOtpExpiresAt: _____,
    ...safe
  } = user;
  return { ...safe, isProfileComplete: isProfileComplete(user) };
}

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    if (body.email) {
      const existing = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(and(eq(usersTable.email, body.email), isNull(usersTable.deletedAt)));
      if (existing.length > 0) {
        return res.status(409).json({ error: "Email already registered" });
      }
    }

    if (body.phone) {
      const existing = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(and(eq(usersTable.phone, body.phone), isNull(usersTable.deletedAt)));
      if (existing.length > 0) {
        return res.status(409).json({ error: "Phone already registered" });
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(usersTable).values({
      email: body.email,
      phone: body.phone,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      nationality: body.nationality ? canonicalCountryEn(body.nationality) ?? body.nationality : undefined,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
    }).returning();

    const tokenPayload = { sub: user.id, email: user.email ?? "", role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(userSessionsTable).values({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt,
    });

    logAudit(req, "user.register", { userId: user.id, entityType: "user", entityId: user.id });
    res.status(201).json({ user: safeUser(user), accessToken, refreshToken });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const whereClause = body.email
      ? and(eq(usersTable.email, body.email), isNull(usersTable.deletedAt))
      : and(eq(usersTable.phone, body.phone!), isNull(usersTable.deletedAt));

    const [user] = await db.select().from(usersTable).where(whereClause);

    if (!user || !user.isActive) {
      logAudit(req, "auth.login_failed", { userId: user?.id ?? null, newValue: { identifier: body.email ?? body.phone } });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      logAudit(req, "auth.login_failed", { userId: user.id });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await db.update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user.id));

    const tokenPayload = { sub: user.id, email: user.email ?? "", role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(userSessionsTable).values({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt,
    });

    logAudit(req, "auth.login", { userId: user.id });
    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh — rotates the refresh token
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const [session] = await db.select().from(userSessionsTable)
      .where(and(
        eq(userSessionsTable.refreshTokenHash, tokenHash),
        isNull(userSessionsTable.revokedAt),
      ));

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Session expired or revoked" });
    }

    const [user] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, payload.sub), isNull(usersTable.deletedAt)));
    if (!user || !user.isActive) return res.status(401).json({ error: "User not found" });

    await db.update(userSessionsTable)
      .set({ revokedAt: new Date() })
      .where(eq(userSessionsTable.id, session.id));

    const tokenPayload = { sub: user.id, email: user.email ?? "", role: user.role };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(userSessionsTable).values({
      userId: user.id,
      refreshTokenHash: hashToken(newRefreshToken),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt,
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(req.body);
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db.update(userSessionsTable)
        .set({ revokedAt: new Date() })
        .where(eq(userSessionsTable.refreshTokenHash, tokenHash));
    }
    logAudit(req, "auth.logout");
    res.json({ message: "Logged out successfully" });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable)
      .where(and(eq(usersTable.id, req.user!.sub), isNull(usersTable.deletedAt)));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(safeUser(user));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/auth/profile
const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  preferredLanguage: z.enum(["ar", "en"]).optional(),
  // Passport
  passportNumber: z.string().optional(),
  passportIssueCountry: z.string().optional(),
  passportIssuePlace: z.string().optional(),
  passportIssueDate: z.string().optional(),
  passportExpiryDate: z.string().optional(),
  passportImageUrl: z.string().optional(),
  // GCC residence
  isGccResident: z.boolean().optional(),
  gccResidenceCountry: z.string().optional(),
  gccResidenceNumber: z.string().optional(),
  gccResidenceExpiry: z.string().optional(),
  gccResidenceFrontUrl: z.string().optional(),
  gccResidenceBackUrl: z.string().optional(),
  // European / Schengen
  isEuropeanResident: z.boolean().optional(),
  europeanDocumentType: z.string().optional(),
  europeanDocumentUrl: z.string().optional(),
  europeanDocumentExpiry: z.string().optional(),
});

router.patch("/auth/profile", requireAuth, async (req, res) => {
  try {
    const body = profileUpdateSchema.parse(req.body);

    // Canonicalize country values so eligibility checks compare exact canonical names.
    // Unrecognized values are stored as-is (user may still fix them in the UI).
    if (body.nationality) body.nationality = canonicalCountryEn(body.nationality) ?? body.nationality;
    if (body.gccResidenceCountry) body.gccResidenceCountry = canonicalCountryEn(body.gccResidenceCountry) ?? body.gccResidenceCountry;
    if (body.passportIssueCountry) body.passportIssueCountry = canonicalCountryEn(body.passportIssueCountry) ?? body.passportIssueCountry;

    // Postgres rejects "" for date columns — convert empty strings to null
    const dateFields = ["dateOfBirth", "passportIssueDate", "passportExpiryDate", "gccResidenceExpiry", "europeanDocumentExpiry"] as const;
    for (const f of dateFields) {
      if ((body as Record<string, unknown>)[f] === "") (body as Record<string, unknown>)[f] = null;
    }

    // Ownership guard: reject any /objects/ document path the writer does not
    // own (per object_uploads). Prevents binding a victim's object into your
    // own profile to later pass the read-authorization check.
    const unowned = await findUnownedObjectPath(req.user!.sub, [
      body.profilePhotoUrl,
      body.passportImageUrl,
      body.gccResidenceFrontUrl,
      body.gccResidenceBackUrl,
      body.europeanDocumentUrl,
    ]);
    if (unowned) {
      return res.status(403).json({ error: "You do not own the referenced document" });
    }

    // If phone is changing, check uniqueness
    if (body.phone) {
      const existing = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(and(eq(usersTable.phone, body.phone), isNull(usersTable.deletedAt)));
      if (existing.length > 0 && existing[0].id !== req.user!.sub) {
        return res.status(409).json({ error: "Phone already in use" });
      }
    }

    const [updated] = await db.update(usersTable)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(usersTable.id, req.user!.sub), isNull(usersTable.deletedAt)))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    // Mark profile as completed if now complete
    if (isProfileComplete(updated) && !updated.profileCompletedAt) {
      await db.update(usersTable)
        .set({ profileCompletedAt: new Date() })
        .where(eq(usersTable.id, updated.id));
      updated.profileCompletedAt = new Date();
    }

    res.json(safeUser(updated));
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
