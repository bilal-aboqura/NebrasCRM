/**
 * run-migration.mjs
 * Runs the bulk-import-export migration against the live Supabase instance
 * using the pg driver via the DIRECT_URL connection string.
 *
 * Usage:  node scripts/run-migration.mjs
 */

import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Try to load pg — if not available, fall back to instructions
let pg;
try {
  pg = require("pg");
} catch {
  console.error("❌  'pg' package not found. Run: npm install pg");
  process.exit(1);
}

const { Client } = pg;

const DIRECT_URL =
  process.env.DIRECT_URL ||
  "postgresql://postgres.rsxyzniiadvrxvmvbspu:yTedNafLHLBNw7ck@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";

const migrationPath = new URL(
  "../supabase/migrations/20260620000000_bulk_import_export.sql",
  import.meta.url
).pathname.replace(/^\/([A-Z]:)/, "$1"); // fix Windows path

const sql = readFileSync(migrationPath, "utf8");

const client = new Client({ connectionString: DIRECT_URL });

async function run() {
  console.log("🔌  Connecting to Supabase...");
  await client.connect();
  console.log("✅  Connected.");
  console.log("🚀  Running migration: 20260620000000_bulk_import_export.sql");
  try {
    await client.query(sql);
    console.log("✅  Migration applied successfully.");
  } catch (err) {
    console.error("❌  Migration failed:", err.message);
    throw err;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
