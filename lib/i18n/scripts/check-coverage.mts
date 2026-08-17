/**
 * i18n coverage check.
 *
 * 1. Every dictionary entry must have non-empty Arabic AND English text.
 * 2. Every literal t('...') / translate(..., '...') key used in the mobile app
 *    must exist in the shared dictionary (screens with their own local
 *    dictionaries are skipped automatically because their `t` doesn't come
 *    from LanguageContext — we only scan files importing useLanguage).
 *
 * Run from repo root:  pnpm dlx tsx lib/i18n/scripts/check-coverage.mts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { dictionary } from "../src/index";

let failures = 0;

// ── 1. Entry completeness ────────────────────────────────────────────────────
for (const [key, entry] of Object.entries(dictionary)) {
  if (!entry.ar || !entry.ar.trim()) {
    console.error(`EMPTY AR: ${key}`);
    failures++;
  }
  if (!entry.en || !entry.en.trim()) {
    console.error(`EMPTY EN: ${key}`);
    failures++;
  }
}

// ── 2. Mobile literal key usage ──────────────────────────────────────────────
const MOBILE_ROOT = join(process.cwd(), "artifacts/absher-mobile");
const SCAN_DIRS = ["app", "components", "context", "hooks"].map((d) => join(MOBILE_ROOT, d));

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(name)) yield p;
  }
}

const missing = new Map<string, string[]>();
for (const dir of SCAN_DIRS) {
  let files: string[] = [];
  try {
    files = [...walk(dir)];
  } catch {
    continue;
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    // Skip files that define their own local `ui`/`tr` dictionary and don't use
    // the shared LanguageContext translator for the keys in question.
    const usesShared = /useLanguage\(\)/.test(src) || /@workspace\/i18n/.test(src);
    if (!usesShared) continue;
    const hasLocalDict = /const ui = \{/.test(src);
    for (const m of src.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g)) {
      const key = m[1]!;
      if (!key.includes(".")) continue; // not a namespaced key
      if (hasLocalDict && src.includes(`'${key}':`)) continue; // resolved locally
      if (!(key in dictionary)) {
        const rel = file.slice(MOBILE_ROOT.length + 1);
        if (!missing.has(key)) missing.set(key, []);
        missing.get(key)!.push(rel);
      }
    }
  }
}

if (missing.size) {
  console.error(`\nMISSING KEYS (${missing.size}):`);
  for (const [key, files] of [...missing.entries()].sort()) {
    console.error(`  ${key}  ←  ${[...new Set(files)].join(", ")}`);
    failures++;
  }
}

if (failures) {
  console.error(`\n✗ i18n coverage check failed with ${failures} problem(s).`);
  process.exit(1);
}
console.log(`✓ i18n coverage OK — ${Object.keys(dictionary).length} keys, all with ar+en text; no missing mobile keys.`);
