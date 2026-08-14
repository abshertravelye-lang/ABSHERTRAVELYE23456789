import {
  db,
  usersTable,
  objectUploadsTable,
  applicationDocumentsTable,
  applicationDocumentVersionsTable,
  visaApplicationSubmissionsTable,
  umrahApplicationsTable,
} from '@workspace/db';
import { and, eq, isNull, or } from 'drizzle-orm';

/**
 * Centralized authorization for private storage objects.
 *
 * Ownership is bound at upload time in `object_uploads` and is the ONLY source
 * of truth for customer ownership — it is never inferred from caller-writable
 * profile/application fields (which would be spoofable).
 */

type StaffDocAccess = 'none' | 'broad' | 'scoped';

/**
 * Classify a caller's staff access to visa-application document objects.
 *  - 'broad'  → super_admin / admin: may read any object (pre-existing behavior).
 *  - 'scoped' → agent holding a document-VIEWING permission (visa_applications or
 *               documents_review): may read ONLY objects tied to a visa
 *               application (a document version, or an application's document
 *               field). documents_request alone does NOT grant file viewing.
 *  - 'none'   → everyone else.
 */
async function classifyStaffDocAccess(userId: string): Promise<StaffDocAccess> {
  const [user] = await db
    .select({ role: usersTable.role, isActive: usersTable.isActive, permissions: usersTable.permissions })
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
  if (!user || !user.isActive) return 'none';
  if (user.role === 'super_admin' || user.role === 'admin') return 'broad';
  if (
    user.role === 'agent' &&
    Array.isArray(user.permissions) &&
    (user.permissions.includes('visa_applications') || user.permissions.includes('documents_review'))
  ) {
    return 'scoped';
  }
  return 'none';
}

/**
 * Is this object path tied to a visa application? Indexed lookups by
 * storagePath. A path qualifies if it is:
 *  - the storagePath of any application_document_versions row, OR
 *  - referenced by any visa_application_submissions document field
 *    (passport / photo / residence front+back / visa image).
 */
export async function isVisaApplicationObject(objectPath: string): Promise<boolean> {
  const [version] = await db
    .select({ id: applicationDocumentVersionsTable.id })
    .from(applicationDocumentVersionsTable)
    .where(eq(applicationDocumentVersionsTable.storagePath, objectPath))
    .limit(1);
  if (version) return true;

  const [submission] = await db
    .select({ id: visaApplicationSubmissionsTable.id })
    .from(visaApplicationSubmissionsTable)
    .where(
      or(
        eq(visaApplicationSubmissionsTable.passportImageUrl, objectPath),
        eq(visaApplicationSubmissionsTable.personalPhotoUrl, objectPath),
        eq(visaApplicationSubmissionsTable.residencyImageUrl, objectPath),
        eq(visaApplicationSubmissionsTable.residencyBackImageUrl, objectPath),
        eq(visaApplicationSubmissionsTable.visaImageUrl, objectPath),
        eq(visaApplicationSubmissionsTable.issuedVisaUrl, objectPath),
      ),
    )
    .limit(1);
  if (submission) return true;

  const [umrah] = await db
    .select({ id: umrahApplicationsTable.id })
    .from(umrahApplicationsTable)
    .where(
      or(
        eq(umrahApplicationsTable.sponsorResidencyImageUrl, objectPath),
        eq(umrahApplicationsTable.passportImageUrl, objectPath),
        eq(umrahApplicationsTable.personalPhotoUrl, objectPath),
        eq(umrahApplicationsTable.issuedVisaUrl, objectPath),
      ),
    )
    .limit(1);
  return !!umrah;
}

/**
 * Does `userId` currently hold staff access to THIS object? super_admin/admin
 * always; agents with a viewing permission only when the object is tied to a
 * visa application. `documents_request` alone never grants file viewing.
 */
export async function callerHasVisaDocAccess(userId: string, objectPath?: string): Promise<boolean> {
  const level = await classifyStaffDocAccess(userId);
  if (level === 'broad') return true;
  if (level === 'scoped') {
    if (!objectPath) return false;
    return await isVisaApplicationObject(objectPath);
  }
  return false;
}

/** Look up the recorded owner of an object path, or null if unknown. */
export async function getObjectOwner(objectPath: string): Promise<string | null> {
  const [row] = await db
    .select({ ownerUserId: objectUploadsTable.ownerUserId })
    .from(objectUploadsTable)
    .where(eq(objectUploadsTable.storagePath, objectPath));
  return row?.ownerUserId ?? null;
}

/**
 * Is `userId` the recorded owner of `objectPath`? Table-lookup ONLY — never
 * consults caller-writable rows.
 */
export async function callerOwnsObject(userId: string, objectPath: string): Promise<boolean> {
  const owner = await getObjectOwner(objectPath);
  return owner !== null && owner === userId;
}

/**
 * Full authorization decision for reading a private object.
 * Grants access to authorized visa staff (any application document) or the
 * recorded owner. Fails closed on error.
 */
export async function isAuthorizedForObject(userId: string, objectPath: string): Promise<boolean> {
  try {
    if (await callerHasVisaDocAccess(userId, objectPath)) return true;
    if (await callerOwnsObject(userId, objectPath)) return true;
    if (await callerOwnsIssuedVisa(userId, objectPath)) return true;
    return await agentCanReadAgencyObject(userId, objectPath);
  } catch {
    return false;
  }
}

/**
 * B2B Agent Portal read-grant. A travel-portal agent (role "agent" WITH a
 * non-null agency_id) may read ONLY objects tied to an agent application that
 * belongs to THE AGENT'S OWN AGENCY. Enforces section 12: agents can never
 * download documents belonging to another agency. Staff employees (role
 * "agent" WITHOUT agency_id) are handled by callerHasVisaDocAccess instead.
 */
async function agentCanReadAgencyObject(userId: string, objectPath: string): Promise<boolean> {
  const [user] = await db
    .select({ role: usersTable.role, isActive: usersTable.isActive, agencyId: usersTable.agencyId })
    .from(usersTable)
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
  if (!user || !user.isActive || user.role !== 'agent' || user.agencyId == null) return false;

  // The object must be referenced by a submission belonging to the agent's agency.
  const [submission] = await db
    .select({ id: visaApplicationSubmissionsTable.id })
    .from(visaApplicationSubmissionsTable)
    .where(
      and(
        eq(visaApplicationSubmissionsTable.agencyId, user.agencyId),
        or(
          eq(visaApplicationSubmissionsTable.passportImageUrl, objectPath),
          eq(visaApplicationSubmissionsTable.personalPhotoUrl, objectPath),
          eq(visaApplicationSubmissionsTable.residencyImageUrl, objectPath),
          eq(visaApplicationSubmissionsTable.residencyBackImageUrl, objectPath),
          eq(visaApplicationSubmissionsTable.visaImageUrl, objectPath),
          eq(visaApplicationSubmissionsTable.issuedVisaUrl, objectPath),
        ),
      ),
    )
    .limit(1);
  if (submission) return true;

  // Also cover document versions attached to that agency's applications
  // (versions → application_documents.applicationId → submission.agencyId).
  const [version] = await db
    .select({ id: applicationDocumentVersionsTable.id })
    .from(applicationDocumentVersionsTable)
    .innerJoin(
      applicationDocumentsTable,
      eq(applicationDocumentVersionsTable.documentId, applicationDocumentsTable.id),
    )
    .innerJoin(
      visaApplicationSubmissionsTable,
      eq(applicationDocumentsTable.applicationId, visaApplicationSubmissionsTable.id),
    )
    .where(
      and(
        eq(applicationDocumentVersionsTable.storagePath, objectPath),
        eq(visaApplicationSubmissionsTable.agencyId, user.agencyId),
      ),
    )
    .limit(1);
  return !!version;
}

/**
 * Customer read-grant for issued visa files: the admin uploads the file (so
 * object_uploads ownership points at the admin), but the customer who owns the
 * application must be able to download it. Grants ONLY when the path is stored
 * as issuedVisaUrl on a submission that belongs to `userId` — issuedVisaUrl is
 * written exclusively by staff, never by the customer, so it is not spoofable.
 */
async function callerOwnsIssuedVisa(userId: string, objectPath: string): Promise<boolean> {
  const [row] = await db
    .select({ id: visaApplicationSubmissionsTable.id })
    .from(visaApplicationSubmissionsTable)
    .where(
      and(
        eq(visaApplicationSubmissionsTable.issuedVisaUrl, objectPath),
        eq(visaApplicationSubmissionsTable.userId, userId),
      ),
    )
    .limit(1);
  if (row) return true;

  // Same grant for Umrah applications: issuedVisaUrl is staff-written only, so
  // the owning pilgrim may download the issued Umrah visa file.
  const [umrah] = await db
    .select({ id: umrahApplicationsTable.id })
    .from(umrahApplicationsTable)
    .where(
      and(
        eq(umrahApplicationsTable.issuedVisaUrl, objectPath),
        eq(umrahApplicationsTable.userId, userId),
      ),
    )
    .limit(1);
  return !!umrah;
}

/**
 * Write-side validation: given a set of candidate string values that a user is
 * trying to persist (e.g. profile document URLs, application document fields,
 * custom-field values), ensure every value that is an internal object path
 * ("/objects/...") is OWNED by `userId`. Non-object values are ignored.
 *
 * Returns the first path that is NOT owned by the writer, or null if all are OK.
 * This prevents a user from binding a victim's object path into their own row
 * to later pass the read-authorization check.
 */
export async function findUnownedObjectPath(
  userId: string,
  values: Array<string | null | undefined>,
): Promise<string | null> {
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v === 'string' && v.startsWith('/objects/')) seen.add(v);
  }
  for (const p of seen) {
    if (!(await callerOwnsObject(userId, p))) return p;
  }
  return null;
}
