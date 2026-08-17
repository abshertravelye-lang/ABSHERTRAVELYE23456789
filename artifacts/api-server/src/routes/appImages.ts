import { Router } from "express";
import { db } from "@workspace/db";
import { appImagesTable } from "@workspace/db";
import { eq, and, or, isNull, lte, gte, asc } from "drizzle-orm";
import {
  ListAppImagesQueryParams,
  ListAppImagesAdminQueryParams,
  CreateAppImageBody,
  UpdateAppImageParams,
  UpdateAppImageBody,
  DeleteAppImageParams,
} from "@workspace/api-zod";

import { requireAuth, requirePermission } from "../middleware/auth";
import { objectStorageClient, ObjectStorageService } from "../lib/objectStorage";

const router = Router();

const toResponse = (r: typeof appImagesTable.$inferSelect) => ({
  ...r,
  startDate: r.startDate ? r.startDate.toISOString() : null,
  endDate: r.endDate ? r.endDate.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// ── Storage cleanup helper ───────────────────────────────────────────────────
// Only handles internal app-images public-object URLs produced by our own
// upload routes.  Checks that no other DB row still references the URL before
// deleting.  Fails safely: logs a warning on any error and never throws.
const APP_IMAGE_URL_PREFIX = "/api/storage/public-objects/app-images/";

function parsePublicObjectPath(
  path: string,
): { bucketName: string; objectName: string } {
  // path looks like "/bucket-name/object/sub/path"
  const p = path.startsWith("/") ? path.slice(1) : path;
  const slashIdx = p.indexOf("/");
  if (slashIdx === -1) return { bucketName: p, objectName: "" };
  return { bucketName: p.slice(0, slashIdx), objectName: p.slice(slashIdx + 1) };
}

async function tryDeleteStorageImage(
  imageUrl: string | null | undefined,
  log: { warn(obj: unknown, msg?: string): void },
): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(APP_IMAGE_URL_PREFIX)) return;

  // filePath = "app-images/<uuid>" (the part after /api/storage/public-objects/)
  const filePath = imageUrl.slice("/api/storage/public-objects/".length);

  // Skip deletion if any other row still references this exact URL.
  try {
    const refs = await db
      .select({ id: appImagesTable.id })
      .from(appImagesTable)
      .where(eq(appImagesTable.imageUrl, imageUrl));
    if (refs.length > 0) return; // still in use
  } catch (e) {
    log.warn({ err: e }, `Storage cleanup: DB reference check failed for ${imageUrl}`);
    return;
  }

  // Delete from GCS.
  try {
    const svc = new ObjectStorageService();
    const searchPaths = svc.getPublicObjectSearchPaths();
    const fullPath = `${searchPaths[0]}/${filePath}`;
    const { bucketName, objectName } = parsePublicObjectPath(fullPath);
    await objectStorageClient
      .bucket(bucketName)
      .file(objectName)
      .delete({ ignoreNotFound: true } as any);
  } catch (e) {
    log.warn({ err: e }, `Storage cleanup: failed to delete orphaned object ${imageUrl}`);
  }
}
// ────────────────────────────────────────────────────────────────────────────

/**
 * GET /app-images — PUBLIC.
 * Returns only active images inside their optional scheduling window,
 * ordered by sortOrder then createdAt. Optional ?category= filter.
 * Clients fall back to bundled/local images when a category is empty.
 */
router.get("/app-images", async (req, res) => {
  try {
    const query = ListAppImagesQueryParams.parse(req.query);
    const now = new Date();
    const conditions = [
      eq(appImagesTable.isActive, true),
      or(isNull(appImagesTable.startDate), lte(appImagesTable.startDate, now)),
      or(isNull(appImagesTable.endDate), gte(appImagesTable.endDate, now)),
    ];
    if (query.category) {
      conditions.push(eq(appImagesTable.category, query.category));
    }
    const rows = await db
      .select()
      .from(appImagesTable)
      .where(and(...conditions))
      .orderBy(asc(appImagesTable.sortOrder), asc(appImagesTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /app-images/admin/list — ADMIN.
 * All rows regardless of active flag / date window, for management.
 */
router.get("/app-images/admin/list", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const query = ListAppImagesAdminQueryParams.parse(req.query);
    const rows = await db
      .select()
      .from(appImagesTable)
      .where(query.category ? eq(appImagesTable.category, query.category) : undefined)
      .orderBy(asc(appImagesTable.sortOrder), asc(appImagesTable.createdAt));
    res.json(rows.map(toResponse));
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/app-images", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const body = CreateAppImageBody.parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (typeof data.startDate === "string") data.startDate = new Date(data.startDate);
    if (typeof data.endDate === "string") data.endDate = new Date(data.endDate);
    const [row] = await db.insert(appImagesTable).values(data as any).returning();
    res.status(201).json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/app-images/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = UpdateAppImageParams.parse({ id: Number(req.params.id) });
    const body = UpdateAppImageBody.parse(req.body);

    // Fetch the current record so we can clean up the old image if replaced.
    const [existing] = await db
      .select({ imageUrl: appImagesTable.imageUrl })
      .from(appImagesTable)
      .where(eq(appImagesTable.id, id));
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (typeof data.startDate === "string") data.startDate = new Date(data.startDate);
    if (typeof data.endDate === "string") data.endDate = new Date(data.endDate);

    const [row] = await db
      .update(appImagesTable)
      .set(data as any)
      .where(eq(appImagesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });

    // After successful DB update, delete the old object if the URL changed.
    const newImageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;
    if (newImageUrl !== undefined && newImageUrl !== existing.imageUrl) {
      void tryDeleteStorageImage(existing.imageUrl, req.log);
    }

    res.json(toResponse(row));
  } catch (e) {
    req.log.error(e);
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/app-images/:id", requireAuth, requirePermission("visa_config"), async (req, res) => {
  try {
    const { id } = DeleteAppImageParams.parse({ id: Number(req.params.id) });

    // Fetch the image URL before deleting so we can clean up storage.
    const [existing] = await db
      .select({ imageUrl: appImagesTable.imageUrl })
      .from(appImagesTable)
      .where(eq(appImagesTable.id, id));

    await db.delete(appImagesTable).where(eq(appImagesTable.id, id));

    // After successful DB delete, remove the object from storage.
    if (existing) {
      void tryDeleteStorageImage(existing.imageUrl, req.log);
    }

    res.status(204).send();
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
