/**
 * Image compression utility using sharp.
 *
 * Compresses/resizes uploaded images before storing them.
 * Accepts JPEG, PNG, WEBP. Rejects everything else.
 *
 * Output is always WEBP at 85 quality, resized to a max of
 * 2000px on the longest side (preserving aspect ratio).
 */
import sharp from 'sharp';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_LABEL = 'JPG, JPEG, PNG, or WEBP';

/**
 * Returns true when the MIME type is an accepted image type.
 */
export function isAcceptedImageType(mimeType: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

export interface CompressOptions {
  /** Maximum width or height in pixels (default 2000). */
  maxDimension?: number;
  /** WEBP quality 1-100 (default 85). */
  quality?: number;
}

/**
 * Compress and resize an image buffer.
 * Returns { buffer, mimeType } — always outputs WEBP.
 */
export async function compressImage(
  input: Buffer,
  opts: CompressOptions = {},
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { maxDimension = 2000, quality = 85 } = opts;
  const buffer = await sharp(input)
    .rotate() // auto-orient from EXIF
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  return { buffer, mimeType: 'image/webp' };
}
