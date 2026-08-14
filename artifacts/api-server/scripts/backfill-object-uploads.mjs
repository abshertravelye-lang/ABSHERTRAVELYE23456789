/**
 * One-time backfill for the object_uploads ownership table.
 *
 * Populates object_uploads from existing document references so that legacy
 * objects (uploaded before ownership binding existed) remain accessible to
 * their rightful owners after the read-authorization check switched to a
 * table-lookup-only model.
 *
 * Sources (attributed to the owning user):
 *   • users profile doc fields (profile_photo_url, passport_image_url,
 *     gcc_residence_front_url, gcc_residence_back_url, european_document_url)
 *   • visa_application_submissions doc fields + object paths embedded in
 *     custom_field_responses (attributed to the submission's user_id)
 *
 * Only values that look like internal object paths ("/objects/...") are
 * backfilled. Full-URL values (e.g. "https://.../api/storage/objects/...") are
 * normalized to their "/objects/..." path. Idempotent: ON CONFLICT DO NOTHING.
 *
 * Run:  node scripts/backfill-object-uploads.mjs
 */
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Normalize any stored doc value to a canonical "/objects/..." path, or null. */
function toObjectPath(value) {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith('/objects/')) return value;
  const idx = value.indexOf('/objects/');
  if (idx !== -1) {
    // Strip everything before "/objects/" (handles full URLs incl. query string)
    let p = value.slice(idx);
    const q = p.indexOf('?');
    if (q !== -1) p = p.slice(0, q);
    return p;
  }
  return null;
}

async function main() {
  const client = await pool.connect();
  let inserted = 0;
  const seen = new Set();

  async function record(path, ownerUserId) {
    const objectPath = toObjectPath(path);
    if (!objectPath || !ownerUserId) return;
    const key = objectPath;
    if (seen.has(key)) return;
    seen.add(key);
    const r = await client.query(
      `INSERT INTO object_uploads (storage_path, owner_user_id)
       VALUES ($1, $2)
       ON CONFLICT (storage_path) DO NOTHING`,
      [objectPath, ownerUserId],
    );
    inserted += r.rowCount;
  }

  // 1) users profile documents
  const users = await client.query(
    `SELECT id, profile_photo_url, passport_image_url,
            gcc_residence_front_url, gcc_residence_back_url, european_document_url
     FROM users WHERE deleted_at IS NULL`,
  );
  for (const u of users.rows) {
    await record(u.profile_photo_url, u.id);
    await record(u.passport_image_url, u.id);
    await record(u.gcc_residence_front_url, u.id);
    await record(u.gcc_residence_back_url, u.id);
    await record(u.european_document_url, u.id);
  }

  // 2) visa application submissions
  const apps = await client.query(
    `SELECT user_id, passport_image_url, personal_photo_url, residency_image_url,
            residency_back_image_url, visa_image_url, custom_field_responses
     FROM visa_application_submissions WHERE user_id IS NOT NULL`,
  );
  for (const a of apps.rows) {
    await record(a.passport_image_url, a.user_id);
    await record(a.personal_photo_url, a.user_id);
    await record(a.residency_image_url, a.user_id);
    await record(a.residency_back_image_url, a.user_id);
    await record(a.visa_image_url, a.user_id);
    const custom = a.custom_field_responses;
    if (custom && typeof custom === 'object') {
      for (const v of Object.values(custom)) {
        if (typeof v === 'string') await record(v, a.user_id);
      }
    }
  }

  client.release();
  await pool.end();
  console.log(`Backfill complete. Inserted ${inserted} object_uploads rows (${seen.size} distinct paths seen).`);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
