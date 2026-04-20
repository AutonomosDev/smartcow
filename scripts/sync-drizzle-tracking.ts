/**
 * sync-drizzle-tracking.ts
 *
 * Registers migration files into drizzle.__drizzle_migrations so that
 * drizzle-kit migrate doesn't try to re-apply already-applied migrations.
 *
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 *
 * Usage:
 *   docker compose exec -T app npx tsx scripts/sync-drizzle-tracking.ts
 *   # or locally (needs DATABASE_URL in env):
 *   npx tsx scripts/sync-drizzle-tracking.ts
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not set");
  process.exit(1);
}

// Mirrors _journal.json exactly — order matters
const MIGRATIONS: { idx: number; tag: string; when: number }[] = [
  { idx: 0,  tag: "0000_futuristic_deathbird",                        when: 1775158385948 },
  { idx: 1,  tag: "0001_organizaciones_multi_tenant",                 when: 1775244000000 },
  { idx: 2,  tag: "0002_auth_jwt_multi_fundo",                        when: 1775358000000 },
  { idx: 3,  tag: "0003_users_password_hash",                         when: 1775444400000 },
  { idx: 4,  tag: "0004_rename_fundo_to_predio",                      when: 1775530800000 },
  { idx: 5,  tag: "0005_firebase_auth",                               when: 1775617200000 },
  { idx: 6,  tag: "0006_rls_predio_isolation",                        when: 1775703600000 },
  { idx: 7,  tag: "0007_conversaciones",                              when: 1776038400000 },
  { idx: 8,  tag: "0008_nextauth_remove_firebase",                    when: 1776124800000 },
  { idx: 9,  tag: "0009_agroapp_events",                              when: 1745280000000 },
  { idx: 10, tag: "0010_chat_sessions_slash_commands_user_tasks",     when: 1745107200000 },
];

const MIGRATIONS_DIR = path.join(process.cwd(), "src/db/migrations");

function hashFile(tag: string): string {
  const filePath = path.join(MIGRATIONS_DIR, `${tag}.sql`);
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Ensure the drizzle schema and table exist (drizzle-kit creates these, but
    // if the table is missing we create it so the script works from scratch)
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS drizzle;
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id          SERIAL PRIMARY KEY,
        hash        TEXT NOT NULL,
        created_at  BIGINT
      );
    `);

    let inserted = 0;
    let skipped = 0;

    for (const { tag, when } of MIGRATIONS) {
      const hash = hashFile(tag);
      const res = await pool.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
         VALUES ($1, $2)
         ON CONFLICT (hash) DO NOTHING
         RETURNING id`,
        [hash, when]
      );
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  ✅  inserted  ${tag}`);
        inserted++;
      } else {
        console.log(`  ⏭   skipped   ${tag} (already tracked)`);
        skipped++;
      }
    }

    const { rows } = await pool.query(
      "SELECT count(*) AS total FROM drizzle.__drizzle_migrations"
    );
    console.log(`\n📊  Total in __drizzle_migrations: ${rows[0].total}`);
    console.log(`   inserted: ${inserted}  |  skipped: ${skipped}`);
    console.log("\n✅  sync-drizzle-tracking complete");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ ", err.message);
  process.exit(1);
});
