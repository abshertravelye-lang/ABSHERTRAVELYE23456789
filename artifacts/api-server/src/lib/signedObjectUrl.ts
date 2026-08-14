import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Path-scoped, short-lived HMAC signatures for private storage objects.
 *
 * A signature authorizes read access to exactly ONE object path until it
 * expires. It is used only where an Authorization header is impossible
 * (e.g. <a download>, a PDF <iframe>, or an <img>/RN Image that cannot send
 * headers). It is NOT a session token: it carries no identity and cannot be
 * replayed against a different path or after `exp`.
 *
 *   sig = HMAC_SHA256(SESSION_SECRET, `${path}:${exp}`)
 *
 * Accepted on GET as `?exp=<unix-seconds>&sig=<hex>`. `download=1` is a
 * separate, non-signed presentation flag and does not affect the signature.
 */

const SIGNING_SECRET =
  process.env.SESSION_SECRET || process.env.JWT_ACCESS_SECRET || 'absher-object-signing-dev-secret';

/** Default signed-URL lifetime (seconds). */
export const SIGNED_URL_TTL_SEC = 600; // 10 minutes

export function computeObjectSignature(objectPath: string, exp: number): string {
  return createHmac('sha256', SIGNING_SECRET)
    .update(`${objectPath}:${exp}`)
    .digest('hex');
}

export interface SignedObjectUrlParts {
  exp: number;
  sig: string;
}

/** Produce `{exp, sig}` for an object path, valid for `ttlSec` seconds. */
export function signObjectPath(objectPath: string, ttlSec: number = SIGNED_URL_TTL_SEC): SignedObjectUrlParts {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  return { exp, sig: computeObjectSignature(objectPath, exp) };
}

/**
 * Verify a signature for the given object path. Returns true only when the
 * signature matches AND has not expired. Constant-time comparison.
 */
export function verifyObjectSignature(objectPath: string, expRaw: unknown, sigRaw: unknown): boolean {
  if (typeof expRaw !== 'string' && typeof expRaw !== 'number') return false;
  if (typeof sigRaw !== 'string' || !sigRaw) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false; // expired

  const expected = computeObjectSignature(objectPath, exp);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sigRaw, 'hex');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
