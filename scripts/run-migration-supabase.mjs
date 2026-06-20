/**
 * run-migration-supabase.mjs
 * Runs the bulk-import-export migration against the live Supabase instance
 * using the @supabase/supabase-js client with the service_role key.
 *
 * Usage:  node scripts/run-migration-supabase.mjs
 */

import { readFileSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SUPABASE_URL = "https://rsxyzniiadvrxvmvbspu.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeHl6bmlpYWR2cnh2bXZic3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY0MzM3NCwiZXhwIjoyMDk3MjE5Mzc0fQ.U7Pv1UW-rw5gQdXGFyktT2paE1Vrj604p1SPADKh9t8";

const migrationPath = join(__dirname, "../supabase/migrations/20260620000000_bulk_import_export.sql");
const sql = readFileSync(migrationPath, "utf8");

// Split into individual statements (split on semicolons followed by whitespace/newlines)
// Filter out empty statements
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

async function run() {
  console.log(`🔌  Connecting to Supabase: ${SUPABASE_URL}`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;

    console.log(`\n📌  [${i + 1}/${statements.length}] Executing:\n${stmt.substring(0, 120)}${stmt.length > 120 ? "..." : ""}`);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: stmt + ";" })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`❌  Failed (HTTP ${response.status}): ${body}`);
    } else {
      console.log("✅  OK");
    }
  }

  console.log("\n🎉  Migration script finished.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
