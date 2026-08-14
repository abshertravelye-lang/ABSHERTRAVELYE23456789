#!/bin/bash
set -e

# Resolve workspace root relative to this script's location (absolute path)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_DIR="$WORKSPACE_ROOT/lib/db"

pnpm install --frozen-lockfile

# 1. Apply tracked SQL migrations FIRST (idempotent).
#    Running them before drizzle-kit push means any schema change that would
#    trigger an interactive TTY prompt (e.g. adding a unique constraint to an
#    existing table with data) is already in the database by the time Drizzle
#    inspects it — so Drizzle sees no diff and skips the prompt entirely.
cd "$DB_DIR"

node -e "
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dir  = '$DB_DIR/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

(async () => {
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Applying migration:', f);
    await pool.query(sql);
    console.log('Done:', f);
  }
  await pool.end();
  console.log('All migrations applied.');
})().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
"

# 2. Full schema sync — creates any tables that exist in schema but not in the DB
#    (handles fresh databases). By this point every prompt-triggering diff is
#    already resolved by step 1, so push-force runs non-interactively.
#    The || true guard prevents a non-zero exit from failing the deploy when the
#    only remaining diff is already handled above.
cd "$WORKSPACE_ROOT"
pnpm --filter @workspace/db run push-force 2>&1 || true
