import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type JwtPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Parses the Bearer token if present but does NOT reject unauthenticated requests. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Token invalid — just ignore it; route can proceed without user context
    }
  }
  next();
}

import { db, usersTable } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Permission } from "../lib/permissions";

/**
 * Staff-only access with per-section permission enforcement, checked
 * against the DATABASE on every request (not just the JWT), so that
 * deactivated employees lose access immediately and permission changes
 * apply without waiting for token expiry.
 *
 * - super_admin: full access to everything.
 * - admin: full access except where a route additionally requires super_admin.
 * - agent (employee): must hold the given permission key.
 * - customers / unauthenticated: rejected.
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    try {
      const [user] = await db
        .select({ role: usersTable.role, isActive: usersTable.isActive, permissions: usersTable.permissions })
        .from(usersTable)
        .where(and(eq(usersTable.id, req.user.sub), isNull(usersTable.deletedAt)));
      if (!user || !user.isActive) {
        res.status(401).json({ error: "Account is inactive" });
        return;
      }
      if (user.role === "super_admin" || user.role === "admin") return next();
      if (user.role === "agent" && Array.isArray(user.permissions) && user.permissions.includes(permission)) {
        return next();
      }
      res.status(403).json({ error: "Insufficient permissions" });
    } catch (e) {
      req.log?.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}


/**
 * DB-backed check: does this authenticated user currently hold the given
 * staff permission? (super_admin/admin always yes; agent needs the key;
 * inactive/deleted users always no.) Use for inline owner-or-staff checks.
 */
export async function hasStaffPermission(userId: string, permission: Permission): Promise<boolean> {
  const [user] = await db
    .select({ role: usersTable.role, isActive: usersTable.isActive, permissions: usersTable.permissions })
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
  if (!user || !user.isActive) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;
  return user.role === "agent" && Array.isArray(user.permissions) && user.permissions.includes(permission);
}

/**
 * DB-backed super_admin gate: verifies the CURRENT role and active status in
 * the database on every request, so demoted/deactivated/deleted super admins
 * lose these privileges immediately (not just at token expiry).
 */
export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    try {
      const [user] = await db
        .select({ role: usersTable.role, isActive: usersTable.isActive })
        .from(usersTable)
        .where(and(eq(usersTable.id, req.user.sub), isNull(usersTable.deletedAt)));
      if (!user || !user.isActive) {
        res.status(401).json({ error: "Account is inactive" });
        return;
      }
      if (user.role !== "super_admin") {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
      next();
    } catch (e) {
      req.log?.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

import { agenciesTable } from "@workspace/db";

/**
 * Loaded agent-portal context, attached to the request by requireAgent.
 * Distinguishes a B2B travel-portal agent (role "agent" WITH an agency_id) from
 * a staff employee (role "agent" WITHOUT an agency_id but WITH permissions).
 */
export interface AgentContext {
  userId: string;
  agencyId: number;
  agencyName: string;
  agencyStatus: "active" | "suspended" | "pending";
}

declare global {
  namespace Express {
    interface Request {
      agent?: AgentContext;
    }
  }
}

/**
 * Agent-portal gate. Loads the caller from the DB and requires:
 *  - role === "agent" AND a non-null agency_id (a travel-portal agent, not a
 *    staff employee),
 *  - an active user account,
 *  - (unless allowInactiveAgency) an "active" agency.
 * On success attaches req.agent. Rejects staff/customers/admins with 403.
 */
export function requireAgent(opts: { allowInactiveAgency?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    try {
      const [user] = await db
        .select({ id: usersTable.id, role: usersTable.role, isActive: usersTable.isActive, agencyId: usersTable.agencyId })
        .from(usersTable)
        .where(and(eq(usersTable.id, req.user.sub), isNull(usersTable.deletedAt)));
      if (!user || !user.isActive) {
        res.status(401).json({ error: "Account is inactive" });
        return;
      }
      if (user.role !== "agent" || user.agencyId == null) {
        res.status(403).json({ error: "Agent portal access only" });
        return;
      }
      const [agency] = await db
        .select({ id: agenciesTable.id, name: agenciesTable.name, status: agenciesTable.status })
        .from(agenciesTable)
        .where(eq(agenciesTable.id, user.agencyId));
      if (!agency) {
        res.status(403).json({ error: "Agency not found" });
        return;
      }
      if (!opts.allowInactiveAgency && agency.status !== "active") {
        res.status(403).json({ error: "Your agency is not active. Please contact ABSHER TRAVEL." });
        return;
      }
      req.agent = {
        userId: user.id,
        agencyId: agency.id,
        agencyName: agency.name,
        agencyStatus: agency.status,
      };
      next();
    } catch (e) {
      req.log?.error(e);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
