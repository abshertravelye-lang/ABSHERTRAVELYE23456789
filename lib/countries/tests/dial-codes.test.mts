/**
 * Focused tests for the canonical phone dial-code helpers in @workspace/countries.
 *
 * Covers:
 *  1. Country-list coverage — every COUNTRIES entry with a dial code appears
 *     in DIAL_COUNTRIES (including territories like AI, AX, BQ, CC, CK, CW,
 *     EH, HK, MO, NC, RE, TW) and every DIAL_COUNTRIES entry has a valid code.
 *  2. Parse/build round trips — parse(build(cc, local)) reproduces the same
 *     full number for every dialable country.
 *  3. Shared-prefix parsing — +1/+7/+44/+39 numbers resolve to the primary
 *     country, and longest-match wins (+1242 vs +1, +212 vs +21…).
 *  4. Edge cases — empty input, missing "+", trunk zeros, non-digits, clearing.
 *
 * Usage: pnpm dlx tsx lib/countries/tests/dial-codes.test.mts
 * Exit 0 = all assertions passed; exit 1 = failure (details printed).
 */
import {
  COUNTRIES,
  DIAL_CODES,
  DIAL_COUNTRIES,
  getDialCode,
  parseInternationalPhone,
  buildInternationalPhone,
} from "../src/index.ts";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ── 1. Country-list coverage ────────────────────────────────────────────────
const dialSet = new Set(DIAL_COUNTRIES.map((c) => c.code));
for (const c of COUNTRIES) {
  if (c.dialCode) {
    check(`coverage: ${c.code} in DIAL_COUNTRIES`, dialSet.has(c.code));
  }
}
for (const code of ["AI", "AX", "BQ", "CC", "CK", "CW", "EH", "HK", "MO", "NC", "RE", "TW", "VA"]) {
  check(`territory selectable: ${code}`, dialSet.has(code));
}
check("VA maps to +379 (canonical)", DIAL_CODES.VA === "+379", `got ${DIAL_CODES.VA}`);
for (const c of DIAL_COUNTRIES) {
  check(`valid dial for ${c.code}`, /^\+\d{1,4}$/.test(c.dialCode), c.dialCode);
  check(`dial matches map for ${c.code}`, c.dialCode === DIAL_CODES[c.code]);
}
check("DIAL_COUNTRIES is non-trivial", DIAL_COUNTRIES.length > 200, String(DIAL_COUNTRIES.length));

// ── 2. Parse/build round trips for every dialable country ──────────────────
for (const c of DIAL_COUNTRIES) {
  const local = "501234567";
  const full = buildInternationalPhone(c.code, local);
  check(`build ${c.code}`, full === `${c.dialCode}${local}`, full);
  const parsed = parseInternationalPhone(full);
  const rebuilt = buildInternationalPhone(parsed.countryCode, parsed.local);
  check(`round trip ${c.code}`, rebuilt === full, `${full} → ${parsed.countryCode}/${parsed.local} → ${rebuilt}`);
}

// ── 3. Shared-prefix and longest-match parsing ──────────────────────────────
const cases: Array<[string, string, string]> = [
  ["+15551234567", "US", "5551234567"],   // NANP → primary US
  ["+12425551234", "BS", "5551234"],      // Bahamas has its own +1242 prefix
  ["+12645551234", "AI", "5551234"],      // Anguilla has its own +1264 prefix
  ["+18095551234", "DO", "5551234"],      // Dominican Republic has its own +1809 prefix
  ["+74951234567", "RU", "4951234567"],   // +7 → RU
  ["+442071234567", "GB", "2071234567"],  // +44 → GB
  ["+390612345678", "IT", "0612345678"],  // +39 → IT (not VA); parse keeps digits verbatim
  ["+3791234567", "VA", "1234567"],       // +379 longest-match beats +39
  ["+966501234567", "SA", "501234567"],
  ["+971501234567", "AE", "501234567"],
  ["+21261234567", "MA", "61234567"],     // +212 → MA (shared with EH)
  ["+35810123456", "FI", "10123456"],     // +358 → FI (shared with AX)
  ["+85212345678", "HK", "12345678"],
  ["+886912345678", "TW", "912345678"],
];
for (const [input, cc, local] of cases) {
  const p = parseInternationalPhone(input);
  check(`parse ${input} → ${cc}/${local}`, p.countryCode === cc && p.local === local, `got ${p.countryCode}/${p.local}`);
}

// ── 4. Edge cases ───────────────────────────────────────────────────────────
check("empty parse falls back to SA", parseInternationalPhone("").countryCode === "SA");
check("empty parse local empty", parseInternationalPhone("").local === "");
check("null-ish parse", parseInternationalPhone(undefined).countryCode === "SA");
// Values without a leading "+" are legacy/local — never guessed as international.
check("missing + treated as legacy (SA)", parseInternationalPhone("966501234567").countryCode === "SA");
check("missing + digits preserved", parseInternationalPhone("966501234567").local === "966501234567");
check("legacy local number defaults to SA", parseInternationalPhone("501234567").countryCode === "SA");
check("legacy local digits are preserved", parseInternationalPhone("501234567").local === "501234567");
check("legacy local number is not treated as Belize", parseInternationalPhone("501234567").countryCode !== "BZ");
check("build strips trunk zero", buildInternationalPhone("SA", "0501234567") === "+966501234567");
// Italy-style plans keep the leading zero — it is part of the national number.
check("IT keeps leading zero on build", buildInternationalPhone("IT", "0612345678") === "+390612345678");
{
  // Profile-save equivalent: stored Italian number must survive parse → build unchanged.
  const p = parseInternationalPhone("+390612345678");
  check("IT parse", p.countryCode === "IT" && p.local === "0612345678", `${p.countryCode}/${p.local}`);
  check("IT round trip preserves zero", buildInternationalPhone(p.countryCode, p.local) === "+390612345678");
}
check("SM keeps leading zero", buildInternationalPhone("SM", "0549123456") === "+3780549123456");
check("build strips non-digits", buildInternationalPhone("SA", "50-123 4567") === "+966501234567");
check("build empty local returns '' (explicit clear)", buildInternationalPhone("SA", "") === "");
check("build zero-only local returns ''", buildInternationalPhone("SA", "000") === "");
check("build unknown country falls back to +966", buildInternationalPhone("ZZ", "501234567") === "+966501234567");
check("getDialCode lowercase input", getDialCode("sa") === "+966");
check("getDialCode unknown", getDialCode("ZZ") === "");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed`);
  process.exit(1);
}
console.log("All dial-code assertions passed.");
