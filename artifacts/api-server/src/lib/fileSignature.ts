/**
 * Content-based (magic-byte) file type verification.
 *
 * Client-declared MIME types (multipart `file.mimetype`, presigned-upload
 * `contentType`) are attacker-controlled and must never be trusted for
 * authorization or document-type enforcement. These helpers derive the type
 * from the actual file bytes instead.
 */
import fs from 'fs/promises';
import path from 'path';

import { ObjectStorageService } from './objectStorage';

const objectStorageService = new ObjectStorageService();
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.local-uploads');

/** How many bytes are needed to identify all supported signatures. */
export const SNIFF_BYTES = 16;

/**
 * Identify a file type from its leading bytes. Returns the verified MIME type
 * or null when the signature is not one of the supported document types.
 */
export function sniffMimeType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 6) {
    const head6 = buf.toString('ascii', 0, 6);
    if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'image/gif';
  }
  if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf';
  }
  return null;
}

/**
 * Read the head of a stored object (GCS, or the dev-only local fallback) and
 * return its content-verified MIME type. Fails CLOSED: returns null when the
 * object cannot be read or its signature is not a supported document type.
 */
export async function sniffStoredObjectMime(objectPath: string): Promise<string | null> {
  // --- GCS ---
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const head: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      file
        .createReadStream({ start: 0, end: SNIFF_BYTES - 1 })
        .on('data', (c: Buffer) => chunks.push(c))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
    return sniffMimeType(head);
  } catch {
    // fall through to the local dev fallback
  }

  // --- Local dev fallback (files written by saveLocally in storage routes) ---
  try {
    const id = objectPath.split('/').pop();
    if (!id) return null;
    const fh = await fs.open(path.join(LOCAL_UPLOAD_DIR, id), 'r');
    try {
      const buf = Buffer.alloc(SNIFF_BYTES);
      const { bytesRead } = await fh.read(buf, 0, SNIFF_BYTES, 0);
      return sniffMimeType(buf.subarray(0, bytesRead));
    } finally {
      await fh.close();
    }
  } catch {
    return null;
  }
}
