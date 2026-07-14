import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, userSessionsTable } from "@workspace/db";
import { eq, and, isNull, or } from "drizzle-orm";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { createHash } from "crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";

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

function safeUser(user: typeof usersTable.$inferSelect) {
  const {
    passwordHash: _,
    deletedAt: __,
    emailVerifyToken: ___,
    phoneOtp: ____,
    phoneOtpExpiresAt: _____,
    ...safe
  } = user;
  return safe;
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
      nationality: body.nationality,
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
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

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

    res.json({ user: safeUser(user), accessToken, refreshToken });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid input" });
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
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

export default router;
