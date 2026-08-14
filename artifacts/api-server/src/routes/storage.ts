import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import multer from 'multer';

import { db, objectUploadsTable } from '@workspace/db';

import { ObjectStorageService, objectStorageClient } from '../lib/objectStorage';
import { ObjectNotFoundError } from '../lib/objectStorage';
import { requireAuth } from '../middleware/auth';
import { verifyAccessToken } from '../lib/jwt';
import { isAuthorizedForObject } from '../lib/objectAccess';
import {
  signObjectPath,
  verifyObjectSignature,
  SIGNED_URL_TTL_SEC,
} from '../lib/signedObjectUrl';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// Local fallback directory (used when GCS is unavailable in dev).
// NEVER used in production: files on the local filesystem are lost on redeploy,
// so in production a GCS failure is a hard error instead of a silent fallback.
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.local-uploads');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function saveLocally(id: string, buffer: Buffer, mimeType: string): Promise<void> {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, id), buffer);
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, `${id}.meta`), mimeType);
}

async function readLocally(id: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const buffer = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, id));
    let mimeType = 'application/octet-stream';
    try { mimeType = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, `${id}.meta`), 'utf8'); } catch {}
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const p = path.startsWith('/') ? path.slice(1) : path;
  const slashIdx = p.indexOf('/');
  if (slashIdx === -1) return { bucketName: p, objectName: '' };
  return { bucketName: p.slice(0, slashIdx), objectName: p.slice(slashIdx + 1) };
}

// ── Authenticated + authorized object access ────────────────────────────────
// Customer documents (passports, IDs, personal photos) are sensitive and must
// never be publicly accessible. Access is granted, fail-closed, only to:
//   • super_admin / admin — always
//   • agent with the "visa_applications" permission — application documents
//   • the customer recorded as the OWNER of the object in `object_uploads`
//
// Ownership is bound at upload time (object_uploads), NOT inferred from
// caller-writable rows, so an attacker cannot claim a victim's object by
// writing its path into their own profile / application fields.
//
// Two ways to authorize a GET:
//   1. A Bearer access token (Authorization header) → identity → the checks above.
//   2. A path-scoped, short-lived HMAC signature (?exp=&sig=) obtained from the
//      authenticated /storage/sign endpoint — used only where headers are
//      impossible (<a download>, PDF <iframe>, some <img>/RN Image cases).
// Session JWTs are NEVER accepted in the query string.

type ObjectAuthResult = 'ok' | 'unauthenticated' | 'forbidden';

async function authorizeObjectAccess(req: Request, objectPath: string): Promise<ObjectAuthResult> {
  // (2) Signed URL — carries no identity; authorizes this exact path until exp.
  if (req.query.sig !== undefined || req.query.exp !== undefined) {
    return verifyObjectSignature(objectPath, req.query.exp, req.query.sig) ? 'ok' : 'forbidden';
  }

  // (1) Bearer token identity.
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return 'unauthenticated';
  let userId: string;
  try {
    userId = verifyAccessToken(authHeader.slice(7)).sub;
  } catch {
    return 'unauthenticated';
  }

  try {
    return (await isAuthorizedForObject(userId, objectPath)) ? 'ok' : 'forbidden';
  } catch (e) {
    req.log.error({ err: e }, 'Object authorization check failed');
    return 'forbidden';
  }
}

/** Derive a safe download filename from the object path + content type. */
function downloadFilename(objectPath: string, contentType: string): string {
  const last = objectPath.split('/').pop() || 'document';
  const base = last.replace(/[^A-Za-z0-9._-]/g, '') || 'document';
  if (/\.[A-Za-z0-9]{2,5}$/.test(base)) return base;
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
  };
  const ext = extMap[contentType.toLowerCase()] ?? 'bin';
  return `${base}.${ext}`;
}

/**
 * POST /storage/uploads
 *
 * Direct multipart file upload. Tries GCS first; falls back to local filesystem
 * when GCS credentials are unavailable (e.g. in development).
 */
router.post(
  '/storage/uploads',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const ownerUserId = req.user!.sub;
    const objectId = randomUUID();
    const objectPath = `/objects/uploads/${objectId}`;
    const mimeType = file.mimetype || 'application/octet-stream';

    // Record ownership FIRST so the object is never orphaned/unowned. This row
    // is the sole source of truth for who may later read the object.
    async function recordOwnership() {
      await db.insert(objectUploadsTable).values({
        storagePath: objectPath,
        ownerUserId,
        originalFilename: file!.originalname ?? null,
        mimeType,
        size: file!.size ?? null,
      });
    }

    // --- Try GCS first ---
    try {
      const privateObjectDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/uploads/${objectId}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);

      const gcsFile = objectStorageClient.bucket(bucketName).file(objectName);
      await gcsFile.save(file.buffer, {
        contentType: mimeType,
        resumable: false,
      });

      await recordOwnership();
      res.json({ objectPath });
      return;
    } catch (gcsError) {
      if (IS_PRODUCTION) {
        // In production the local filesystem is ephemeral — never fall back.
        req.log.error({ err: gcsError }, 'GCS upload failed in production');
        res.status(500).json({ error: 'Failed to upload file to object storage' });
        return;
      }
      req.log.warn({ err: gcsError }, 'GCS upload failed — falling back to local filesystem (dev only)');
    }

    // --- Local filesystem fallback (development only) ---
    try {
      await saveLocally(objectId, file.buffer, mimeType);
      await recordOwnership();
      res.json({ objectPath, _local: true });
    } catch (localError) {
      req.log.error({ err: localError }, 'Local upload also failed');
      res.status(500).json({ error: 'Failed to upload file' });
    }
  },
);

/**
 * POST /storage/uploads/request-url
 */
router.post(
  '/storage/uploads/request-url',
  requireAuth,
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Bind ownership NOW, at request time, so objects created via the
      // presigned-URL path are owned exactly like the direct-upload path.
      // Without this, request-url objects had no object_uploads row and failed
      // every ownership check. Idempotent on the unique storage_path.
      await db
        .insert(objectUploadsTable)
        .values({
          storagePath: objectPath,
          ownerUserId: req.user!.sub,
          originalFilename: name ?? null,
          mimeType: contentType ?? null,
          size: typeof size === 'number' ? size : null,
        })
        .onConflictDoNothing({ target: objectUploadsTable.storagePath });

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/sign
 *
 * Returns a short-lived, path-scoped signed URL for a private object. The caller
 * must be authenticated AND pass the SAME authorization check applied to GET
 * (owner via object_uploads, or authorized visa staff / admin). Used by clients
 * only where an Authorization header is impossible (<a download>, PDF iframe,
 * RN Image). The signature carries no identity and cannot be replayed against a
 * different path or after it expires.
 *
 * Query: ?path=/objects/uploads/<id>[&download=1]
 * Returns: { url, exp }
 */
router.get('/storage/sign', requireAuth, async (req: Request, res: Response) => {
  const rawPath = typeof req.query.path === 'string' ? req.query.path : '';
  // Only private object paths may be signed.
  if (!/^\/objects\/[A-Za-z0-9._/-]+$/.test(rawPath) || rawPath.includes('..')) {
    res.status(400).json({ error: 'Invalid object path' });
    return;
  }

  const allowed = await isAuthorizedForObject(req.user!.sub, rawPath);
  if (!allowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { exp, sig } = signObjectPath(rawPath, SIGNED_URL_TTL_SEC);
  const params = new URLSearchParams({ exp: String(exp), sig });
  if (req.query.download === '1' || req.query.download === 'true') params.set('download', '1');
  res.json({ url: `/api/storage${rawPath}?${params.toString()}`, exp });
});

/**
 * GET /storage/objects/*
 *
 * Serves files from GCS, falling back to the local filesystem when GCS is unavailable.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  const raw = req.params.path;
  const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
  const objectPath = `/objects/${wildcardPath}`;

  // --- Enforce authentication + authorization (fail closed) ---
  // Customer documents are sensitive; never serve them without proving the
  // caller is a super_admin/admin, an authorized visa staff member, the owning
  // customer (via Bearer token), or a valid path-scoped signed URL.
  const authResult = await authorizeObjectAccess(req, objectPath);
  if (authResult !== 'ok') {
    res.status(authResult === 'unauthenticated' ? 401 : 403).json({
      error: authResult === 'unauthenticated' ? 'Authentication required' : 'Forbidden',
    });
    return;
  }

  const asDownload = req.query.download === '1' || req.query.download === 'true';

  // --- Try GCS first ---
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    // Sensitive documents must never be cached by shared caches.
    res.setHeader('Cache-Control', 'private, no-store');

    if (asDownload) {
      const ct = response.headers.get('content-type') || 'application/octet-stream';
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${downloadFilename(objectPath, ct)}"`,
      );
    }

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
    return;
  } catch (gcsError) {
    if (!(gcsError instanceof ObjectNotFoundError)) {
      req.log.warn({ err: gcsError }, 'GCS serve failed — trying local fallback');
    }
  }

  // --- Local filesystem fallback (development only) ---
  // wildcardPath is like "uploads/<uuid>"
  const localId = wildcardPath.replace(/^uploads\//, '');
  const local = IS_PRODUCTION ? null : await readLocally(localId);
  if (local) {
    res.set('Content-Type', local.mimeType);
    res.set('Cache-Control', 'private, no-store');
    if (asDownload) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${downloadFilename(objectPath, local.mimeType)}"`,
      );
    }
    res.send(local.buffer);
    return;
  }

  res.status(404).json({ error: 'Object not found' });
});

export default router;
