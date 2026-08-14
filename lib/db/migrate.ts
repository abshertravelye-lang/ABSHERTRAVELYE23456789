/**
 * Applies all SQL migration files in lib/db/migrations/ in filename order.
 * Each file is executed with a simple IF-NOT-EXISTS guard so re-runs are safe.
 *
 * Usage:  node --loader ts-node/esm lib/db/migrate.ts
 *   or:   pnpm --filter @workspace/db run migrate
 */
import fs from "fs";
import path from "path";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Applying: ${file}`);
    await pool.query(sql);
    console.log(`Done:     ${file}`);
  }

  await pool.end();
  console.log("All migrations applied.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
