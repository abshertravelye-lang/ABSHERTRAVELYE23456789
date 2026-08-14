---
name: Admin RBAC model
description: How staff access control works across api-server and absher-admin; rules for adding new admin routes/pages.
---

# Admin RBAC model

Rule: every staff-facing route in api-server must be gated with `requirePermission(<key>)` (DB-checked per request — immediate deactivation/permission changes) or `requireSuperAdmin()` (also DB-backed). Never gate super-admin actions with JWT-only `requireRole` — a demoted/deactivated admin keeps a valid token until expiry. For owner-or-staff detail endpoints, use `hasStaffPermission(userId, perm)` inline.

Permission keys: overview, bookings, payments, reports, visa_applications, visa_config, customers, employees, messages, notifications, settings, audit_logs. Presets (visa/support/flight/hotel employee) live in api-server `src/lib/permissions.ts`; agents need explicit keys, admin/super_admin bypass.

**Why:** code review found anon-writable content routes (destinations/offers/programs) and JWT-role bypasses after the initial pass — new routes silently default to open unless gated.

**How to apply:** when adding any admin endpoint or nav item: gate the backend route, add the nav-item→permission mapping in absher-admin `pages/admin/index.tsx`, and wrap the route with `guard(perm, Comp)`. Content GETs stay public; all mutations gated.

Other durable facts:
- Admin app tokens use localStorage keys `absher_admin_access_token`/`absher_admin_refresh_token` (separate from travel's keys); each artifact bundle has its own api-client singleton, so no cross-app handler conflict.
- API is mounted at root `/api/...` — never prefix it with the artifact base path (`/absher-admin/api/...` 404s).
- Super admin seed: `scripts/src/seed-admin.ts` (admin@absher.com). App download links live in `app_settings` table, exposed via GET /api/settings/public (whitelisted keys only).
- Audit: `logAudit(req, action, opts)` fire-and-forget; audit staff CRUD, logins, settings changes, visa status changes.
