/**
 * Integration test: server-side document validation + agency isolation.
 *
 * Runs against a RUNNING dev API server (http://localhost:80/api) and the
 * development database. Creates its own agencies/agents, exercises the
 * upload + agent-application endpoints, and cleans up everything it created
 * (DB rows and stored objects).
 *
 * Usage:  node tests/document-validation.test.mjs
 * Exit 0 = all assertions passed; exit 1 = failure (details printed).
 *
 * Covers:
 *  1. Spoofed multipart MIME (non-PDF bytes declared application/pdf) is
 *     rejected at the direct-upload boundary.
 *  2. Spoofed presigned-URL upload (declared PDF, actual PNG bytes) is
 *     rejected at agent-application submission by content sniffing.
 *  3. Wrong document class for a configured slot (image where PDF required)
 *     is rejected at submission.
 *  4. Unknown documentKey without a display name is rejected.
 *  5. Valid submission (genuine PDF for required slot + ad-hoc extra) succeeds.
 *  6. Agency isolation: a second agency gets 403 on the first agency's
 *     application documents; unauthenticated requests get 401.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import zlib from 'node:zlib';

const API = process.env.API_BASE_URL || 'http://localhost:80/api';
const VISA_ID = Number(process.env.TEST_VISA_ID || 12); // a visa with a required PDF doc (hotel-booking)
const PASSWORD = 'Itest!2026x';
const RUN = randomUUID().slice(0, 8);

const failures = [];
function check(name, cond, detail = '') {
  const ok = Boolean(cond);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(name);
}

function sql(query) {
  return execFileSync('psql', [process.env.DATABASE_URL, '-t', '-A', '-c', query], { encoding: 'utf8' }).trim();
}

// ── Minimal valid file fixtures ─────────────────────────────────────────────
function makePng() {
  const chunk = (type, data) => {
    const c = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(c) : require('node:zlib').crc32(c));
    return Buffer.concat([len, c, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(8, 0); ihdr.writeUInt32BE(8, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.concat(Array.from({ length: 8 }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(24, 0x77)])));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
const PNG = makePng();
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Size 2>>\n%%EOF');
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(120, 0x41)]);

// ── HTTP helpers ────────────────────────────────────────────────────────────
async function api(path, { method = 'GET', token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (form !== undefined) body = form;
  const res = await fetch(`${API}${path}`, { method, headers, body });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function fileForm(buffer, filename, declaredType) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: declaredType }), filename);
  return form;
}

// ── Setup: two agencies with agent accounts ─────────────────────────────────
const hash = await bcrypt.hash(PASSWORD, 12);
const createdAgencyIds = [];
async function createAgencyWithAgent(label) {
  const name = `ITEST-${RUN} ${label}`;
  const email = `itest-${RUN}-${label}@test.local`;
  sql(`INSERT INTO agencies (name, contact_email, status) VALUES ('${name}', '${email}', 'active')`);
  const agencyId = Number(sql(`SELECT id FROM agencies WHERE name='${name}'`));
  createdAgencyIds.push(agencyId);
  sql(`INSERT INTO users (id, email, password_hash, role, first_name, is_active, email_verified_at, agency_id)
       VALUES (gen_random_uuid(), '${email}', '${hash}', 'agent', '${label}', true, now(), ${agencyId})`);
  sql(`INSERT INTO agency_visa_services (agency_id, visa_id, enabled, agent_price, currency)
       VALUES (${agencyId}, ${VISA_ID}, true, 300.00, 'SAR')`);
  const login = await api('/auth/login', { method: 'POST', json: { email, password: PASSWORD } });
  if (!login.data?.accessToken) throw new Error(`login failed for ${email}: ${JSON.stringify(login.data)}`);
  return { agencyId, email, token: login.data.accessToken };
}

let exitCode = 1;
let appId = null;
const uploadedPaths = [];
try {
  const a = await createAgencyWithAgent('a');
  const b = await createAgencyWithAgent('b');

  // ── 1. Spoofed multipart MIME rejected at upload ──────────────────────────
  const spoofExe = await api('/storage/uploads', { method: 'POST', token: a.token, form: fileForm(EXE, 'doc.pdf', 'application/pdf') });
  check('spoofed EXE-as-PDF rejected at upload (400)', spoofExe.status === 400, `got ${spoofExe.status}`);
  const spoofPng = await api('/storage/uploads', { method: 'POST', token: a.token, form: fileForm(PNG, 'doc.pdf', 'application/pdf') });
  check('spoofed PNG-as-PDF rejected at upload (400)', spoofPng.status === 400, `got ${spoofPng.status}`);
  const spoofPdfAsImg = await api('/storage/uploads', { method: 'POST', token: a.token, form: fileForm(PDF, 'img.jpg', 'image/jpeg') });
  check('spoofed PDF-as-JPEG rejected at upload (400)', spoofPdfAsImg.status === 400, `got ${spoofPdfAsImg.status}`);

  // ── Genuine uploads succeed ───────────────────────────────────────────────
  const upImg = await api('/storage/uploads', { method: 'POST', token: a.token, form: fileForm(PNG, 'photo.png', 'image/png') });
  const upPdf = await api('/storage/uploads', { method: 'POST', token: a.token, form: fileForm(PDF, 'hotel.pdf', 'application/pdf') });
  check('genuine PNG upload accepted', upImg.status === 200 && upImg.data?.objectPath, `got ${upImg.status}`);
  check('genuine PDF upload accepted', upPdf.status === 200 && upPdf.data?.objectPath, `got ${upPdf.status}`);
  const IMG = upImg.data.objectPath, PDFPATH = upPdf.data.objectPath;
  uploadedPaths.push(IMG, PDFPATH);

  const appBody = (documents) => ({
    visaId: VISA_ID, applicantNationality: 'Saudi Arabia', fullName: `ITEST ${RUN}`,
    gender: 'male', dateOfBirth: '1991-01-01', email: `itest-${RUN}-app@test.local`,
    phone: '+966500000009', passportNumber: `IT${RUN}`, passportIssueDate: '2022-01-01',
    passportExpiryDate: '2032-01-01', agreedToTerms: true,
    passportImageUrl: IMG, personalPhotoUrl: IMG, documents,
  });

  // ── 2. Presigned-URL spoof rejected at submission ─────────────────────────
  const reqUrl = await api('/storage/uploads/request-url', {
    method: 'POST', token: a.token,
    json: { name: 'fake.pdf', size: PNG.length, contentType: 'application/pdf' },
  });
  if (reqUrl.status === 200 && reqUrl.data?.uploadURL) {
    const put = await fetch(reqUrl.data.uploadURL, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: PNG });
    if (put.ok) {
      uploadedPaths.push(reqUrl.data.objectPath);
      const spoofSubmit = await api('/agent/applications', {
        method: 'POST', token: a.token,
        json: appBody([{ documentKey: 'hotel-booking', storagePath: reqUrl.data.objectPath }]),
      });
      check('presigned spoof (PNG bytes as PDF) rejected at submission (422)', spoofSubmit.status === 422, `got ${spoofSubmit.status}`);
    } else {
      check('presigned spoof test (PUT succeeded)', false, `PUT got ${put.status}`);
    }
  } else {
    console.log('SKIP  presigned spoof test — request-url unavailable in this environment');
  }

  // ── 3. Wrong class for configured slot rejected ───────────────────────────
  const wrongClass = await api('/agent/applications', {
    method: 'POST', token: a.token,
    json: appBody([{ documentKey: 'hotel-booking', storagePath: IMG }]),
  });
  check('image for PDF-required slot rejected (422)', wrongClass.status === 422, `got ${wrongClass.status}`);

  // ── 4. Unknown documentKey without name rejected ──────────────────────────
  const unknownKey = await api('/agent/applications', {
    method: 'POST', token: a.token,
    json: appBody([
      { documentKey: 'hotel-booking', storagePath: PDFPATH },
      { documentKey: `bogus-${RUN}`, storagePath: PDFPATH },
    ]),
  });
  check('unknown documentKey without name rejected (422)', unknownKey.status === 422, `got ${unknownKey.status}`);

  // ── 5. Valid submission succeeds ──────────────────────────────────────────
  const valid = await api('/agent/applications', {
    method: 'POST', token: a.token,
    json: appBody([
      { documentKey: 'hotel-booking', storagePath: PDFPATH },
      { nameAr: 'كشف حساب', nameEn: 'Bank Statement', storagePath: PDFPATH },
    ]),
  });
  check('valid submission accepted (201)', valid.status === 201 && valid.data?.id, `got ${valid.status}: ${JSON.stringify(valid.data)}`);
  appId = valid.data?.id;

  // ── 6. Agency isolation ───────────────────────────────────────────────────
  if (appId) {
    const otherList = await api(`/visa-applications/${appId}/documents`, { token: b.token });
    check("agency B cannot list agency A's documents (403)", otherList.status === 403, `got ${otherList.status}`);
    const anonList = await api(`/visa-applications/${appId}/documents`, {});
    check('unauthenticated document list rejected (401)', anonList.status === 401, `got ${anonList.status}`);
    const ownList = await api(`/visa-applications/${appId}/documents`, { token: a.token });
    check('agency A can list its own documents (200)', ownList.status === 200, `got ${ownList.status}`);
  }

  exitCode = failures.length === 0 ? 0 : 1;
} catch (err) {
  console.error('ERROR', err);
} finally {
  // ── Cleanup: DB rows then stored objects ──────────────────────────────────
  try {
    if (appId) {
      sql(`DELETE FROM application_document_versions WHERE document_id IN (SELECT id FROM application_documents WHERE application_id=${appId})`);
      sql(`DELETE FROM application_documents WHERE application_id=${appId}`);
      sql(`DELETE FROM visa_application_submissions WHERE id=${appId}`);
    }
    sql(`DELETE FROM agency_visa_services WHERE agency_id IN (SELECT id FROM agencies WHERE name LIKE 'ITEST-${RUN}%')`);
    sql(`DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'itest-${RUN}%')`);
    sql(`DELETE FROM audit_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'itest-${RUN}%')`);
    sql(`DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'itest-${RUN}%')`);
    sql(`DELETE FROM object_uploads WHERE owner_user_id IN (SELECT id FROM users WHERE email LIKE 'itest-${RUN}%')`);
    sql(`DELETE FROM users WHERE email LIKE 'itest-${RUN}%'`);
    sql(`DELETE FROM agencies WHERE name LIKE 'ITEST-${RUN}%'`);
  } catch (e) {
    console.error('cleanup DB error', e.message);
  }
  // Delete stored objects (GCS via sidecar creds; ignore failures in dev).
  try {
    const { Storage } = await import('@google-cloud/storage');
    const client = new Storage({
      credentials: {
        audience: 'replit', subject_token_type: 'access_token',
        token_url: 'http://127.0.0.1:1106/token', type: 'external_account',
        credential_source: { url: 'http://127.0.0.1:1106/credential', format: { type: 'json', subject_token_field_name: 'access_token' } },
        universe_domain: 'googleapis.com',
      }, projectId: '',
    });
    const dir = process.env.PRIVATE_OBJECT_DIR;
    for (const p of uploadedPaths) {
      const id = p.split('/').pop();
      const parts = `${dir}/uploads/${id}`.split('/').filter(Boolean);
      await client.bucket(parts[0]).file(parts.slice(1).join('/')).delete().catch(() => {});
    }
  } catch {}
}

console.log(failures.length === 0 ? '\nAll checks passed.' : `\n${failures.length} check(s) FAILED: ${failures.join(', ')}`);
process.exit(exitCode);
