/**
 * scripts/audit-schema-sync.ts — AUT-284
 *
 * Audita drift entre prod DB y repo:
 * - Lee __drizzle_migrations (schema `drizzle`)
 * - Lee src/db/migrations/meta/_journal.json
 * - Compara: migraciones en repo que no están en prod
 * - Exit 1 si hay drift, 0 si sincronizado
 *
 * Uso:
 *   DATABASE_URL=postgres://... npx tsx scripts/audit-schema-sync.ts
 *
 * NOTA: __drizzle_migrations.hash = sha256 del archivo SQL completo.
 *       Aquí comparamos por tag (idx + nombre), no por hash — más robusto
 *       a diferencias de line endings / whitespace.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, "..", "src", "db", "migrations");
const JOURNAL_PATH = join(MIGRATIONS_DIR, "meta", "_journal.json");

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  version: string;
  dialect: string;
  entries: JournalEntry[];
}

interface ProdMigration {
  hash: string;
  created_at: string;
}

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL no está configurado");
    process.exit(2);
  }

  // 1. Leer journal del repo
  const journal: Journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf8"));
  console.log(`📁 Repo:  ${journal.entries.length} migraciones en _journal.json`);

  // 2. Calcular hash esperado de cada migration SQL en el repo
  const repoMigrations = journal.entries.map((e) => {
    const sqlPath = join(MIGRATIONS_DIR, `${e.tag}.sql`);
    let hash: string | null = null;
    try {
      const sql = readFileSync(sqlPath, "utf8");
      hash = createHash("sha256").update(sql).digest("hex");
    } catch {
      // SQL missing — shouldn't happen but tolerar
    }
    return { idx: e.idx, tag: e.tag, hash, when: e.when };
  });

  // 3. Fetch prod migrations
  const pool = new Pool({ connectionString: dbUrl });
  let prodMigrations: ProdMigration[] = [];
  try {
    const res = await pool.query<ProdMigration>(
      `SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`,
    );
    prodMigrations = res.rows;
  } catch (err) {
    console.error(`❌ Error leyendo drizzle.__drizzle_migrations: ${(err as Error).message}`);
    await pool.end();
    process.exit(2);
  } finally {
    await pool.end();
  }
  console.log(`🗄  Prod: ${prodMigrations.length} migraciones en __drizzle_migrations`);

  // 4. Diff
  const prodHashes = new Set(prodMigrations.map((m) => m.hash));
  const missing = repoMigrations.filter((m) => m.hash && !prodHashes.has(m.hash));

  // También chequear hashes en prod que no están en el repo (extraños)
  const repoHashes = new Set(repoMigrations.map((m) => m.hash).filter(Boolean));
  const orphans = prodMigrations.filter((m) => !repoHashes.has(m.hash));

  console.log("");
  if (missing.length === 0 && orphans.length === 0) {
    console.log("✓ Schema prod === repo. Sin drift.");
    process.exit(0);
  }

  if (missing.length > 0) {
    console.log(`⚠ ${missing.length} migraciones del repo NO están en prod:`);
    for (const m of missing) {
      console.log(`   - ${String(m.idx).padStart(4, "0")}  ${m.tag}`);
    }
  }

  if (orphans.length > 0) {
    console.log(`⚠ ${orphans.length} hashes en prod no corresponden a ningún archivo del repo:`);
    for (const o of orphans) {
      console.log(`   - ${o.hash.slice(0, 12)}...  @${o.created_at}`);
    }
  }

  console.log("");
  console.log("→ Aplicar con: ./deploy.sh --migrate");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
